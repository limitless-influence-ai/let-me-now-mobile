import * as Sentry from '@sentry/react-native';
import {
  deriveWsUrl,
  handleWsMessage,
  WsMessageActions,
} from '@/hooks/useWebSocket';

jest.mock('@sentry/react-native', () => ({
  captureException: jest.fn(),
  captureMessage: jest.fn(),
}));

describe('deriveWsUrl', () => {
  // NOTE: mutate keys in place — do NOT reassign `process.env`. Expo's babel
  // transform rewrites `process.env.EXPO_PUBLIC_*` to read from
  // `expo/virtual/env`, which captures the original `process.env` reference at
  // import time. Reassigning the object would detach that live reference.
  const PREV_WS = process.env.EXPO_PUBLIC_WS_URL;
  const PREV_API = process.env.EXPO_PUBLIC_API_URL;

  const restore = (key: string, value: string | undefined) => {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  };

  beforeEach(() => {
    delete process.env.EXPO_PUBLIC_WS_URL;
    delete process.env.EXPO_PUBLIC_API_URL;
  });

  afterAll(() => {
    restore('EXPO_PUBLIC_WS_URL', PREV_WS);
    restore('EXPO_PUBLIC_API_URL', PREV_API);
  });

  it('derives wss:// from an https API URL', () => {
    process.env.EXPO_PUBLIC_API_URL = 'https://api.x';
    expect(deriveWsUrl(48.85, 2.35)).toBe(
      'wss://api.x/api/v1/ws/alerts?lat=48.85&lon=2.35',
    );
  });

  it('derives ws:// from an http API URL', () => {
    process.env.EXPO_PUBLIC_API_URL = 'http://localhost:8000';
    expect(deriveWsUrl(1, 2)).toBe(
      'ws://localhost:8000/api/v1/ws/alerts?lat=1&lon=2',
    );
  });

  it('anchors the scheme replacement (does not rewrite "http" inside the host/path)', () => {
    process.env.EXPO_PUBLIC_API_URL = 'https://api.x/httpbin';
    const url = deriveWsUrl(0, 0);
    expect(url).toBe('wss://api.x/httpbin/api/v1/ws/alerts?lat=0&lon=0');
    expect(url).not.toContain('wsbin');
  });

  it('prioritises EXPO_PUBLIC_WS_URL when set', () => {
    process.env.EXPO_PUBLIC_WS_URL = 'wss://realtime.x';
    process.env.EXPO_PUBLIC_API_URL = 'https://api.x';
    expect(deriveWsUrl(10, 20)).toBe(
      'wss://realtime.x/api/v1/ws/alerts?lat=10&lon=20',
    );
  });

  it('falls back to API_URL when WS_URL is empty', () => {
    process.env.EXPO_PUBLIC_WS_URL = '';
    process.env.EXPO_PUBLIC_API_URL = 'http://localhost:8000';
    expect(deriveWsUrl(1, 2)).toBe(
      'ws://localhost:8000/api/v1/ws/alerts?lat=1&lon=2',
    );
  });

  it('returns null when both env vars are empty/undefined', () => {
    expect(deriveWsUrl(1, 2)).toBeNull();
  });

  it('returns null when both env vars are empty strings', () => {
    process.env.EXPO_PUBLIC_WS_URL = '';
    process.env.EXPO_PUBLIC_API_URL = '';
    expect(deriveWsUrl(1, 2)).toBeNull();
  });
});

describe('handleWsMessage', () => {
  const makeActions = (): jest.Mocked<WsMessageActions> => ({
    addAlert: jest.fn(),
    removeAlert: jest.fn(),
  });

  const rawAlert = {
    id: 'a1',
    user_id: 'u1',
    type: 'AGRESSION',
    lat: 48.8566,
    lon: 2.3522,
    location_label: 'Châtelet, Paris 1er',
    status: 'ACTIVE',
    created_at: '2026-05-29T10:00:00Z',
    updated_at: '2026-05-29T10:00:00Z',
    expires_at: null,
    comment: null,
    photo_url: null,
    radius_m: 500,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('new_alert → addAlert with a mapped (camelCase, lowercase-status) Alert', () => {
    const actions = makeActions();
    handleWsMessage(JSON.stringify({ event: 'new_alert', alert: rawAlert }), actions);

    expect(actions.addAlert).toHaveBeenCalledTimes(1);
    expect(actions.addAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'a1',
        userId: 'u1',
        locationLabel: 'Châtelet, Paris 1er',
        status: 'active',
        radiusM: 500,
      }),
    );
    expect(actions.removeAlert).not.toHaveBeenCalled();
  });

  it('alert_expired → removeAlert(alert_id)', () => {
    const actions = makeActions();
    handleWsMessage(JSON.stringify({ event: 'alert_expired', alert_id: 'a1' }), actions);

    expect(actions.removeAlert).toHaveBeenCalledWith('a1');
    expect(actions.addAlert).not.toHaveBeenCalled();
  });

  it('alert_removed → removeAlert(alert_id)', () => {
    const actions = makeActions();
    handleWsMessage(JSON.stringify({ event: 'alert_removed', alert_id: 'a2' }), actions);

    expect(actions.removeAlert).toHaveBeenCalledWith('a2');
    expect(actions.addAlert).not.toHaveBeenCalled();
  });

  it('alert_updated → no store mutation (V1.5 ignored in MVP)', () => {
    const actions = makeActions();
    handleWsMessage(JSON.stringify({ event: 'alert_updated', alert: rawAlert }), actions);

    expect(actions.addAlert).not.toHaveBeenCalled();
    expect(actions.removeAlert).not.toHaveBeenCalled();
  });

  it('pong → no store mutation and no Sentry call', () => {
    const actions = makeActions();
    handleWsMessage(JSON.stringify({ event: 'pong' }), actions);

    expect(actions.addAlert).not.toHaveBeenCalled();
    expect(actions.removeAlert).not.toHaveBeenCalled();
    expect(Sentry.captureMessage).not.toHaveBeenCalled();
  });

  it('unknown event → Sentry.captureMessage, no crash, no mutation', () => {
    const actions = makeActions();
    expect(() =>
      handleWsMessage(JSON.stringify({ event: 'something_else' }), actions),
    ).not.toThrow();

    expect(Sentry.captureMessage).toHaveBeenCalledTimes(1);
    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      'Unknown WS event',
      expect.objectContaining({ extra: expect.any(Object) }),
    );
    expect(actions.addAlert).not.toHaveBeenCalled();
    expect(actions.removeAlert).not.toHaveBeenCalled();
  });

  it('malformed JSON → handled gracefully (Sentry.captureException, no throw)', () => {
    const actions = makeActions();
    expect(() => handleWsMessage('{not valid json', actions)).not.toThrow();

    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
    expect(actions.addAlert).not.toHaveBeenCalled();
    expect(actions.removeAlert).not.toHaveBeenCalled();
  });
});
