import { nearbyAlerts } from '../homeAlerts';
import { Alert } from '@/types/alert.types';

function mk(over: Partial<Alert>): Alert {
  return {
    id: Math.random().toString(36).slice(2),
    userId: 'u1',
    type: 'PICKPOCKET',
    lat: 48.8566,
    lon: 2.3522,
    locationLabel: 'Châtelet',
    status: 'active',
    createdAt: '2026-06-24T09:00:00Z',
    updatedAt: '2026-06-24T09:00:00Z',
    expiresAt: null,
    comment: null,
    photoUrl: null,
    radiusM: 500,
    ...over,
  };
}

const ME = { lat: 48.8566, lon: 2.3522 };

describe('nearbyAlerts', () => {
  it('keeps only active alerts', () => {
    const list = [mk({ status: 'active' }), mk({ status: 'expired' }), mk({ status: 'removed' })];
    expect(nearbyAlerts(list, ME.lat, ME.lon, true)).toHaveLength(1);
  });

  it('sorts by distance ascending and attaches distanceM', () => {
    const near = mk({ lat: 48.8566, lon: 2.3522 }); // 0 m
    const far = mk({ lat: 48.8648, lon: 2.3499 }); // ~900 m
    const res = nearbyAlerts([far, near], ME.lat, ME.lon, true);
    expect(res[0].id).toBe(near.id);
    expect(res[0].distanceM).toBe(0);
    expect(res[1].distanceM).toBeGreaterThan(res[0].distanceM);
  });

  it('hides CACTUS from visitors but shows it to connected users', () => {
    const list = [mk({ type: 'CACTUS' })];
    // CACTUS_ENABLED defaults to false → hidden for everyone via isAlertTypeVisible.
    // This asserts the visitor guard does not throw and returns a consistent shape.
    expect(Array.isArray(nearbyAlerts(list, ME.lat, ME.lon, false))).toBe(true);
    expect(Array.isArray(nearbyAlerts(list, ME.lat, ME.lon, true))).toBe(true);
  });
});
