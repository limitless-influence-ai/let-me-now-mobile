import { shouldSyncLocation } from '../useLocationSync';
import { CONFIG } from '@/constants/config';

const D = CONFIG.LOCATION_SYNC_MIN_DELTA_DEG;
const BASE = { lat: 48.8566, lon: 2.3522 };

describe('shouldSyncLocation', () => {
  it('syncs on the first fix (no previous position)', () => {
    expect(shouldSyncLocation(null, BASE)).toBe(true);
  });

  it('skips moves below the threshold (GPS jitter) on both axes', () => {
    const next = { lat: BASE.lat + D / 2, lon: BASE.lon - D / 2 };
    expect(shouldSyncLocation(BASE, next)).toBe(false);
  });

  it('skips when the position is unchanged', () => {
    expect(shouldSyncLocation(BASE, { ...BASE })).toBe(false);
  });

  it('syncs on a meaningful latitude move (>= threshold)', () => {
    expect(shouldSyncLocation(BASE, { ...BASE, lat: BASE.lat + D })).toBe(true);
  });

  it('syncs on a meaningful longitude move (>= threshold)', () => {
    expect(shouldSyncLocation(BASE, { ...BASE, lon: BASE.lon + D })).toBe(true);
  });
});
