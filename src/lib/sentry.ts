import * as Sentry from '@sentry/react-native';

/**
 * Initialize Sentry error reporting.
 *
 * `captureException` / `captureMessage` are already called across the app
 * (WS hook, location sync, geocoding) but stay silent no-ops until `init` runs.
 *
 * The DSN comes from `EXPO_PUBLIC_SENTRY_DSN`. When it is empty (e.g. local dev)
 * we skip initialization entirely — Sentry then stays a clean no-op without
 * crashing or logging errors.
 *
 * @returns `true` if Sentry was initialized, `false` if skipped (no DSN).
 */
export function initSentry(): boolean {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (!dsn) {
    return false;
  }

  Sentry.init({
    dsn,
    // MVP: error capture only — no performance tracing / session replay.
    tracesSampleRate: 0,
  });

  return true;
}
