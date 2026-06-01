/* eslint-env jest */
import { renderHook, act } from '@testing-library/react-native';

// --- mocks (declared before importing the unit under test) ---------------

jest.mock('@sentry/react-native', () => ({
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  addBreadcrumb: jest.fn(),
}));

const mockList = jest.fn();
jest.mock('@/services/alerts.service', () => ({
  alertsService: { list: (...args: unknown[]) => mockList(...args) },
  // keep mapAlert a passthrough — handleWsMessage isn't exercised against the store here
  mapAlert: (raw: unknown) => raw,
}));

const mockSetAlerts = jest.fn();
const mockAddAlert = jest.fn();
const mockRemoveAlert = jest.fn();
jest.mock('@/store/alerts.store', () => ({
  useAlertsStore: () => ({
    addAlert: mockAddAlert,
    removeAlert: mockRemoveAlert,
    setAlerts: mockSetAlerts,
  }),
}));

let appStateHandler: ((s: string) => void) | null = null;
const mockRemoveSub = jest.fn();
jest.mock('react-native', () => ({
  AppState: {
    addEventListener: jest.fn((_event: string, handler: (s: string) => void) => {
      appStateHandler = handler;
      return { remove: mockRemoveSub };
    }),
  },
}));

import * as Sentry from '@sentry/react-native';
import {
  computeReconnectDelay,
  handleWsMessage,
  useWebSocket,
} from '../useWebSocket';
import { CONFIG } from '@/constants/config';

// --- mock WebSocket ------------------------------------------------------

const sockets: MockWebSocket[] = [];

class MockWebSocket {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  url: string;
  onopen: (() => void) | null = null;
  onmessage: ((e: { data: string }) => void) | null = null;
  onerror: ((e: unknown) => void) | null = null;
  onclose: (() => void) | null = null;
  send = jest.fn();
  closeCode: number | undefined;
  closeReason: string | undefined;

  constructor(url: string) {
    this.url = url;
    sockets.push(this);
  }

  // test helpers
  open(): void {
    this.readyState = MockWebSocket.OPEN;
    this.onopen?.();
  }
  receive(raw: string): void {
    this.onmessage?.({ data: raw });
  }
  close = jest.fn((code?: number, reason?: string) => {
    this.closeCode = code;
    this.closeReason = reason;
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.();
  });
}

beforeEach(() => {
  jest.useFakeTimers();
  sockets.length = 0;
  appStateHandler = null;
  jest.clearAllMocks();
  mockList.mockResolvedValue([]);
  (global as unknown as { WebSocket: unknown }).WebSocket = MockWebSocket;
});

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});

const ENV_URL = 'ws://test.local';
beforeAll(() => {
  process.env.EXPO_PUBLIC_WS_URL = ENV_URL;
});

// --- computeReconnectDelay ----------------------------------------------

describe('computeReconnectDelay', () => {
  it('follows exponential backoff capped at MAX', () => {
    expect(computeReconnectDelay(0)).toBe(1000);
    expect(computeReconnectDelay(1)).toBe(2000);
    expect(computeReconnectDelay(2)).toBe(4000);
    expect(computeReconnectDelay(4)).toBe(16000);
    expect(computeReconnectDelay(100)).toBe(CONFIG.WS_RECONNECT_MAX_DELAY_MS);
    expect(computeReconnectDelay(100)).toBe(30000);
  });
});

// --- handleWsMessage: pong wiring ---------------------------------------

describe('handleWsMessage', () => {
  it('invokes onPong on a pong frame', () => {
    const onPong = jest.fn();
    handleWsMessage(JSON.stringify({ event: 'pong' }), {
      addAlert: jest.fn(),
      removeAlert: jest.fn(),
      onPong,
    });
    expect(onPong).toHaveBeenCalledTimes(1);
  });

  it('captures malformed JSON to Sentry and does not throw', () => {
    expect(() =>
      handleWsMessage('not-json', { addAlert: jest.fn(), removeAlert: jest.fn() }),
    ).not.toThrow();
    expect(Sentry.captureException).toHaveBeenCalled();
  });
});

// --- useWebSocket lifecycle ---------------------------------------------

describe('useWebSocket', () => {
  it('opens a socket and re-fetches alerts on connect', async () => {
    mockList.mockResolvedValue([{ id: 'a1' }]);
    renderHook(() => useWebSocket(48.85, 2.35, 600));
    expect(sockets).toHaveLength(1);

    await act(async () => {
      sockets[0].open();
    });

    expect(mockList).toHaveBeenCalledWith(48.85, 2.35, 600);
    expect(mockSetAlerts).toHaveBeenCalledWith([{ id: 'a1' }]);
  });

  it('exposes isConnected toggled by open/close', async () => {
    const { result } = renderHook(() => useWebSocket(1, 2));
    expect(result.current.isConnected).toBe(false);
    await act(async () => {
      sockets[0].open();
    });
    expect(result.current.isConnected).toBe(true);
    act(() => {
      sockets[0].close();
    });
    expect(result.current.isConnected).toBe(false);
  });

  it('schedules a reconnect with backoff on unexpected close and resets the counter on reopen', async () => {
    renderHook(() => useWebSocket(1, 2));
    await act(async () => {
      sockets[0].open();
    });

    // unexpected close (not intentional) → reconnect after BASE delay
    act(() => {
      sockets[0].onclose?.();
    });
    expect(sockets).toHaveLength(1);
    act(() => {
      jest.advanceTimersByTime(CONFIG.WS_RECONNECT_BASE_DELAY_MS);
    });
    expect(sockets).toHaveLength(2);

    // second unexpected close → next delay is 2 * BASE.
    // The reconnected socket was opened by the runtime, so it really reached
    // OPEN before dropping — mirror that without firing onopen (which would
    // reset the attempt counter and change the expected backoff).
    sockets[1].readyState = MockWebSocket.OPEN;
    act(() => {
      sockets[1].onclose?.();
    });
    act(() => {
      jest.advanceTimersByTime(CONFIG.WS_RECONNECT_BASE_DELAY_MS);
    });
    expect(sockets).toHaveLength(2); // not enough time yet
    act(() => {
      jest.advanceTimersByTime(CONFIG.WS_RECONNECT_BASE_DELAY_MS);
    });
    expect(sockets).toHaveLength(3);

    // successful reopen resets attempt → next close reconnects at BASE again
    await act(async () => {
      sockets[2].open();
    });
    act(() => {
      sockets[2].onclose?.();
    });
    act(() => {
      jest.advanceTimersByTime(CONFIG.WS_RECONNECT_BASE_DELAY_MS);
    });
    expect(sockets).toHaveLength(4);
  });

  it('AppState active during a pending reconnect cancels the timer (no double socket)', async () => {
    renderHook(() => useWebSocket(1, 2));
    await act(async () => {
      sockets[0].open();
    });

    // unexpected close schedules a reconnect timer (BASE delay). The socket
    // really transitioned to CLOSED, so mirror that before firing onclose.
    sockets[0].readyState = MockWebSocket.CLOSED;
    act(() => {
      sockets[0].onclose?.();
    });
    expect(sockets).toHaveLength(1);

    // BEFORE the timer fires, the app returns to the foreground. The closed
    // socket (readyState CLOSED) makes handleAppState call connect(), whose
    // clearReconnectTimer() cancels the pending backoff timer.
    act(() => {
      appStateHandler?.('active');
    });
    expect(sockets).toHaveLength(2); // exactly one new socket

    // advancing past the (now-cancelled) backoff must NOT create a third socket
    act(() => {
      jest.advanceTimersByTime(CONFIG.WS_RECONNECT_MAX_DELAY_MS * 2);
    });
    expect(sockets).toHaveLength(2);
  });

  it('does NOT reconnect after an intentional/background close', async () => {
    renderHook(() => useWebSocket(1, 2));
    await act(async () => {
      sockets[0].open();
    });

    // background → intentional close, no reconnect
    act(() => {
      appStateHandler?.('background');
    });
    expect(sockets[0].close).toHaveBeenCalledWith(1000, 'app_background');

    act(() => {
      jest.advanceTimersByTime(CONFIG.WS_RECONNECT_MAX_DELAY_MS * 2);
    });
    expect(sockets).toHaveLength(1); // no new socket

    // foreground → reopen
    act(() => {
      appStateHandler?.('active');
    });
    expect(sockets).toHaveLength(2);
  });

  it('sends a ping after the heartbeat interval and reconnects when no pong arrives', async () => {
    renderHook(() => useWebSocket(1, 2));
    await act(async () => {
      sockets[0].open();
    });

    act(() => {
      jest.advanceTimersByTime(CONFIG.WS_HEARTBEAT_INTERVAL_MS);
    });
    expect(sockets[0].send).toHaveBeenCalledWith(JSON.stringify({ event: 'ping' }));

    // no pong within timeout → zombie → close → reconnect scheduled
    act(() => {
      jest.advanceTimersByTime(CONFIG.WS_PONG_TIMEOUT_MS);
    });
    expect(sockets[0].close).toHaveBeenCalled();
    act(() => {
      jest.advanceTimersByTime(CONFIG.WS_RECONNECT_BASE_DELAY_MS);
    });
    expect(sockets).toHaveLength(2);
  });

  it('clears the pong-timeout when a pong is received (no zombie reconnect)', async () => {
    renderHook(() => useWebSocket(1, 2));
    await act(async () => {
      sockets[0].open();
    });

    act(() => {
      jest.advanceTimersByTime(CONFIG.WS_HEARTBEAT_INTERVAL_MS);
    });
    // pong arrives in time
    act(() => {
      sockets[0].receive(JSON.stringify({ event: 'pong' }));
    });
    act(() => {
      jest.advanceTimersByTime(CONFIG.WS_PONG_TIMEOUT_MS + CONFIG.WS_RECONNECT_BASE_DELAY_MS);
    });
    // no forced reconnect: still a single socket and it was never closed
    expect(sockets).toHaveLength(1);
    expect(sockets[0].close).not.toHaveBeenCalled();
  });

  it('reports onerror to Sentry', async () => {
    renderHook(() => useWebSocket(1, 2));
    await act(async () => {
      sockets[0].open();
    });
    act(() => {
      sockets[0].onerror?.({});
    });
    expect(Sentry.captureException).toHaveBeenCalled();
  });

  it('tears down socket and AppState subscription on unmount', async () => {
    const { unmount } = renderHook(() => useWebSocket(1, 2));
    await act(async () => {
      sockets[0].open();
    });
    unmount();
    expect(sockets[0].close).toHaveBeenCalledWith(1000, 'unmount');
    expect(mockRemoveSub).toHaveBeenCalled();
    // an intentional unmount close must not schedule a reconnect
    act(() => {
      jest.advanceTimersByTime(CONFIG.WS_RECONNECT_MAX_DELAY_MS * 2);
    });
    expect(sockets).toHaveLength(1);
  });
});
