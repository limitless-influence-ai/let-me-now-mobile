import {
  FOREGROUND_NOTIFICATION_BEHAVIOR,
  pushTapTarget,
} from '../pushNotifications';

describe('FOREGROUND_NOTIFICATION_BEHAVIOR', () => {
  it('shows the banner + list + sound so a foreground push is never silently dropped', () => {
    expect(FOREGROUND_NOTIFICATION_BEHAVIOR.shouldShowBanner).toBe(true);
    expect(FOREGROUND_NOTIFICATION_BEHAVIOR.shouldShowList).toBe(true);
    expect(FOREGROUND_NOTIFICATION_BEHAVIOR.shouldPlaySound).toBe(true);
  });

  it('never sets the OS badge (unread count is driven in-app)', () => {
    expect(FOREGROUND_NOTIFICATION_BEHAVIOR.shouldSetBadge).toBe(false);
  });
});

describe('pushTapTarget', () => {
  it('routes a nearby-alert push to the alerts list', () => {
    expect(
      pushTapTarget({ type: 'ALERT_NEARBY', alert_id: 'abc-123' }),
    ).toBe('/(tabs)/alertes');
  });

  it('falls back to the alerts list when the payload is empty', () => {
    expect(pushTapTarget()).toBe('/(tabs)/alertes');
    expect(pushTapTarget({})).toBe('/(tabs)/alertes');
  });
});
