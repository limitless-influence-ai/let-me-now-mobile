import { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as Sentry from '@sentry/react-native';
import { useAlertsStore } from '@/store/alerts.store';
import { alertsService, mapAlert } from '@/services/alerts.service';
import { CONFIG } from '@/constants/config';
import { Alert, WsServerMessage } from '@/types/alert.types';
import { DEMO_MODE } from '@/demo/mock';

/** Store actions consumed by the WS message dispatcher. */
export interface WsMessageActions {
  addAlert: (alert: Alert) => void;
  removeAlert: (id: string) => void;
  /** Invoked on a `pong` frame so the hook can clear its pong-timeout. */
  onPong?: () => void;
}

/**
 * Pure dispatcher for a raw server→client WS frame.
 *
 * Parses `raw`, then routes on the discriminating `event` field per the
 * backend contract (WS_REALTIME_CONTRACT.md §2). Malformed JSON and unknown
 * events are reported to Sentry and swallowed — this never throws.
 */
export function handleWsMessage(raw: string, actions: WsMessageActions): void {
  let data: WsServerMessage;
  try {
    data = JSON.parse(raw) as WsServerMessage;
  } catch (err) {
    Sentry.captureException(err);
    return;
  }

  switch (data.event) {
    case 'new_alert':
      actions.addAlert(mapAlert(data.alert));
      break;
    case 'alert_updated':
      // V1.5 — typed but intentionally ignored in MVP (no store mutation).
      break;
    case 'alert_expired':
      actions.removeAlert(data.alert_id);
      break;
    case 'alert_removed':
      actions.removeAlert(data.alert_id);
      break;
    case 'pong':
      // Heartbeat reply — let the hook clear its pong-timeout.
      actions.onPong?.();
      break;
    default:
      Sentry.captureMessage('Unknown WS event', { extra: { data } });
  }
}

/**
 * Derives the WebSocket URL for the alerts stream.
 *
 * Base resolution order:
 *  1. `EXPO_PUBLIC_WS_URL` if defined and non-empty (used verbatim).
 *  2. Otherwise `EXPO_PUBLIC_API_URL` with the leading `http` scheme rewritten
 *     to `ws` via an anchored regex (`http://` → `ws://`, `https://` → `wss://`).
 *
 * Returns `null` when neither env var yields a usable base, so the caller can
 * guard against opening a socket to an invalid URL.
 */
export function deriveWsUrl(lat: number, lon: number): string | null {
  const explicit = process.env.EXPO_PUBLIC_WS_URL;
  const base =
    explicit && explicit.length > 0
      ? explicit
      : (process.env.EXPO_PUBLIC_API_URL?.replace(/^http/, 'ws') ?? '');

  if (!base) return null;

  return `${base}/api/v1/ws/alerts?lat=${lat}&lon=${lon}`;
}

/**
 * Pure exponential-backoff schedule: `min(BASE * 2^attempt, MAX)`.
 *
 * attempt 0 → 1s, 1 → 2s, 2 → 4s, 3 → 8s, 4 → 16s, then capped at 30s.
 * Extracted so the reconnect timing is unit-testable without a socket.
 */
export function computeReconnectDelay(attempt: number): number {
  const delay = CONFIG.WS_RECONNECT_BASE_DELAY_MS * 2 ** attempt;
  return Math.min(delay, CONFIG.WS_RECONNECT_MAX_DELAY_MS);
}

/** Close code used to flag a deliberate, no-reconnect close. */
const INTENTIONAL_CLOSE_CODE = 1000;
const APP_BACKGROUND_REASON = 'app_background';

/**
 * Resilient WebSocket connection to the alerts stream.
 *
 * Handles: exponential reconnection on unexpected close, heartbeat ping with
 * pong-timeout zombie detection, AppState background/foreground lifecycle,
 * error logging to Sentry, and a backfill re-fetch on every (re)connect (the
 * WS does not buffer messages missed during a gap — contract §5).
 *
 * @param radiusM single radius used for the backfill fetch (MVP — defaults to
 *   the standard radius). Non-breaking: existing callers pass only lat/lon.
 */
export function useWebSocket(
  lat: number | null,
  lon: number | null,
  radiusM: number = CONFIG.DEFAULT_RADIUS_M,
) {
  const [isConnected, setIsConnected] = useState(false);

  const ws = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartbeatTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const pongTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attempt = useRef(0);
  /** True while a close we initiated is in flight — suppresses auto-reconnect. */
  const intentionalClose = useRef(false);

  const { addAlert, removeAlert, setAlerts } = useAlertsStore();

  // Keep store actions / coordinates reachable from the long-lived connect
  // closure without re-subscribing the effect on every render.
  const actionsRef = useRef({ addAlert, removeAlert, setAlerts });
  actionsRef.current = { addAlert, removeAlert, setAlerts };

  useEffect(() => {
    // Demo mode runs fully offline — alerts come from the mock layer, so the
    // realtime socket is intentionally never opened (no reconnects / Sentry noise).
    if (DEMO_MODE) return;
    if (lat === null || lon === null) return;

    const url = deriveWsUrl(lat, lon);
    if (url === null) {
      Sentry.captureException(
        new Error(
          'useWebSocket: no WebSocket base URL — set EXPO_PUBLIC_WS_URL or EXPO_PUBLIC_API_URL',
        ),
      );
      return;
    }

    const logTransition = (message: string): void => {
      Sentry.addBreadcrumb({ category: 'ws', message, level: 'info' });
    };

    const clearReconnectTimer = (): void => {
      if (reconnectTimer.current !== null) {
        clearTimeout(reconnectTimer.current);
        reconnectTimer.current = null;
      }
    };

    const clearHeartbeat = (): void => {
      if (heartbeatTimer.current !== null) {
        clearInterval(heartbeatTimer.current);
        heartbeatTimer.current = null;
      }
      if (pongTimer.current !== null) {
        clearTimeout(pongTimer.current);
        pongTimer.current = null;
      }
    };

    /** Backfill alerts missed while the socket was down (contract §5). */
    const refetch = async (): Promise<void> => {
      try {
        const alerts = await alertsService.list(lat, lon, radiusM);
        actionsRef.current.setAlerts(alerts);
      } catch (err) {
        Sentry.captureException(err);
      }
    };

    const startHeartbeat = (): void => {
      clearHeartbeat();
      heartbeatTimer.current = setInterval(() => {
        const socket = ws.current;
        if (socket === null || socket.readyState !== WebSocket.OPEN) return;
        socket.send(JSON.stringify({ event: 'ping' }));
        // Arm the pong watchdog: no reply in time → treat as a zombie socket.
        if (pongTimer.current !== null) clearTimeout(pongTimer.current);
        pongTimer.current = setTimeout(() => {
          pongTimer.current = null;
          // Force a reconnect: an unexpected close triggers backoff via onclose,
          // which is the single source of the 'reconnecting' breadcrumb.
          ws.current?.close();
        }, CONFIG.WS_PONG_TIMEOUT_MS);
      }, CONFIG.WS_HEARTBEAT_INTERVAL_MS);
    };

    const onPong = (): void => {
      if (pongTimer.current !== null) {
        clearTimeout(pongTimer.current);
        pongTimer.current = null;
      }
    };

    const connect = (): void => {
      // Tear down any prior socket/timers before opening a new one.
      clearReconnectTimer();
      clearHeartbeat();
      intentionalClose.current = false;

      logTransition(attempt.current === 0 ? 'connecting' : 'reconnecting');
      const socket = new WebSocket(url);
      ws.current = socket;

      socket.onopen = () => {
        // Ignore events from a socket that has been superseded by a newer one
        // (effect re-run / forced reconnect) — only the current socket drives state.
        if (ws.current !== socket) return;
        attempt.current = 0;
        setIsConnected(true);
        logTransition('connected');
        startHeartbeat();
        void refetch();
      };

      socket.onmessage = (event) => {
        if (ws.current !== socket) return;
        handleWsMessage(event.data as string, {
          addAlert: actionsRef.current.addAlert,
          removeAlert: actionsRef.current.removeAlert,
          onPong,
        });
      };

      socket.onerror = (event) => {
        if (ws.current !== socket) return;
        Sentry.captureException(
          event instanceof Error ? event : new Error('WebSocket error'),
        );
      };

      socket.onclose = () => {
        // A superseded socket's deferred onclose must not schedule a reconnect:
        // the current socket (if any) is already driving the connection.
        if (ws.current !== socket) return;
        setIsConnected(false);
        clearHeartbeat();
        if (intentionalClose.current) {
          // Deliberate close (unmount / background) — do not reconnect.
          logTransition('closed');
          return;
        }
        const delay = computeReconnectDelay(attempt.current);
        attempt.current += 1;
        logTransition('reconnecting');
        clearReconnectTimer();
        reconnectTimer.current = setTimeout(connect, delay);
      };
    };

    const close = (reason: string): void => {
      intentionalClose.current = true;
      clearReconnectTimer();
      clearHeartbeat();
      ws.current?.close(INTENTIONAL_CLOSE_CODE, reason);
    };

    const handleAppState = (next: AppStateStatus): void => {
      if (next === 'active') {
        // Reopen only if we previously closed (avoid duplicate sockets).
        if (ws.current === null || ws.current.readyState === WebSocket.CLOSED) {
          attempt.current = 0;
          connect();
        }
      } else if (next === 'background') {
        close(APP_BACKGROUND_REASON);
      }
    };

    const appStateSub = AppState.addEventListener('change', handleAppState);

    attempt.current = 0;
    connect();

    return () => {
      appStateSub.remove();
      intentionalClose.current = true;
      clearReconnectTimer();
      clearHeartbeat();
      ws.current?.close(INTENTIONAL_CLOSE_CODE, 'unmount');
      ws.current = null;
    };
  }, [lat, lon, radiusM]);

  return { isConnected };
}
