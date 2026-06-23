import type { NotificationBehavior } from 'expo-notifications';
import type { Href } from 'expo-router';

/**
 * How a push is presented while the app is in the FOREGROUND.
 *
 * Without an explicit handler the OS silently drops a notification that arrives
 * while the app is open (iOS especially) — the user would never see it. We show
 * the banner + list + sound, but never set the app badge (the unread count is
 * driven by the in-app notifications list, not the OS badge).
 */
export const FOREGROUND_NOTIFICATION_BEHAVIOR: NotificationBehavior = {
  shouldShowBanner: true,
  shouldShowList: true,
  shouldPlaySound: true,
  shouldSetBadge: false,
};

/**
 * Where a notification tap should take the user. Every current push type
 * (`ALERT_NEARBY`) routes to the alerts list; isolating the decision keeps it
 * pure and testable, and ready to branch per `data.type` later (e.g. deep-link
 * a specific alert on the map).
 */
export function pushTapTarget(_data?: Record<string, unknown>): Href {
  return '/(tabs)/alertes';
}
