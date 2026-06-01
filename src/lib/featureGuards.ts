import { AlertType } from '@/types/alert.types';

/**
 * Whether an alert of this type may surface anywhere in the UI — map markers,
 * detail sheet, auto popups, lists, the report-type picker.
 *
 * CACTUS is suppressed while its feature flag is off: the data and the code
 * stay in place, only the UI hides it. Every other type is always visible.
 *
 * The flag is passed in (rather than read from `FEATURES` here) so the guard
 * stays pure and both branches are unit-testable without mocking the config.
 */
export function isAlertTypeVisible(type: AlertType, cactusEnabled: boolean): boolean {
  if (type === 'CACTUS') return cactusEnabled;
  return true;
}

/** Outcome of tapping the "Live" footer tab. */
export type LiveTabAction = 'navigate' | 'coming-soon';

/**
 * What tapping the "Live" footer tab should do. The Live screen isn't built
 * yet, so while the feature flag is off the tap surfaces a "coming soon"
 * message instead of navigating. Once the flag is on, navigation proceeds.
 */
export function liveTabAction(liveEnabled: boolean): LiveTabAction {
  return liveEnabled ? 'navigate' : 'coming-soon';
}
