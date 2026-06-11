export const CONFIG = {
  DEFAULT_RADIUS_M: 500,
  CACTUS_RADIUS_M: 200,
  MIN_RADIUS_M: 300,
  MAX_RADIUS_M: 1000,
  CACTUS_POPUP_INTERVAL_MS: 150_000, // 2 min 30
  MIN_VOTES_THRESHOLD: 10,
  INVALIDATION_RATIO: 0.7,
  SCORE_INITIAL: 100,
  SCORE_CONFIRMED: 2,
  SCORE_INVALIDATED: -1,
  SCORE_BAN_THRESHOLD: 30,
  ACCESS_TOKEN_EXPIRE_MS: 3_600_000, // 1h
  SPLASH_DURATION_MS: 2_000,
  WS_RECONNECT_BASE_DELAY_MS: 1_000,
  WS_RECONNECT_MAX_DELAY_MS: 30_000,
  WS_HEARTBEAT_INTERVAL_MS: 30_000,
  WS_PONG_TIMEOUT_MS: 10_000,
  // Minimum movement (in degrees, ~55 m) before re-syncing the user's
  // position to the backend — avoids spamming on tiny GPS jitter.
  LOCATION_SYNC_MIN_DELTA_DEG: 0.0005,
} as const;

/**
 * UI feature flags. Toggle a feature on/off across the app without removing
 * its code. Keep the flagged code in place — only its visibility is gated.
 *
 * - CACTUS_ENABLED: surface the Cactus (transit controllers) feature in the UI
 *   (map markers, filter toggle, auto popup, detail sheet, lists, report type).
 * - LIVE_ENABLED: the "Live" footer tab (street artists in transit). Screen not
 *   built yet — while false, tapping the tab shows a "coming soon" message.
 * - LOST_LUGGAGE_ENABLED: the "Bagage oublié" alert type [V1.5]. While false it
 *   is surfaced as a disabled "coming soon" preview (filter toggle + report
 *   type picker) and is never reportable. Promoting it requires extending the
 *   backend `alert_type` enum + the mobile `AlertType` union with LOST_LUGGAGE.
 * - ABDUCTION_ENABLED: the "Enlèvement" alert type [V2], same disabled-preview
 *   treatment as Bagage oublié.
 * - CHILD_SAFETY_ENABLED: the "Comportement suspect envers mineurs" alert type
 *   [V2] — describes an OBSERVABLE behaviour in progress, never a nominative
 *   accusation. Same disabled-preview treatment. Promoting either requires
 *   extending the backend `alert_type` enum + the mobile `AlertType` union.
 */
export const FEATURES = {
  CACTUS_ENABLED: false,
  LIVE_ENABLED: false,
  LOST_LUGGAGE_ENABLED: false,
  ABDUCTION_ENABLED: false,
  CHILD_SAFETY_ENABLED: false,
} as const;
