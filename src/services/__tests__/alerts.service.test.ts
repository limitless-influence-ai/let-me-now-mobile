import { mapAlert } from '../alerts.service';
import { Alert } from '@/types/alert.types';

function rawAlert(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'a1',
    user_id: 'u1',
    type: 'PICKPOCKET',
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
    ...overrides,
  };
}

describe('mapAlert', () => {
  it('lowercases backend UPPERCASE status', () => {
    expect(mapAlert(rawAlert({ status: 'ACTIVE' })).status).toBe('active');
    expect(mapAlert(rawAlert({ status: 'EXPIRED' })).status).toBe('expired');
    expect(mapAlert(rawAlert({ status: 'REMOVED' })).status).toBe('removed');
  });

  it('leaves already-lowercase status untouched', () => {
    expect(mapAlert(rawAlert({ status: 'active' })).status).toBe('active');
  });

  it('is defensive when status is missing', () => {
    const raw = rawAlert();
    delete raw.status;
    expect(mapAlert(raw).status).toBe('');
  });

  it('maps snake_case fields and applies radius default', () => {
    const raw = rawAlert();
    delete raw.radius_m;
    const a = mapAlert(raw);
    expect(a.userId).toBe('u1');
    expect(a.locationLabel).toBe('Châtelet, Paris 1er');
    expect(a.radiusM).toBe(500);
    expect(a.expiresAt).toBeNull();
  });
});

// The rendered-map filter (src/app/(tabs)/carte/index.tsx) hides any alert whose
// status is not 'active'. That predicate is `a.status === 'active'`, applied to
// alerts produced by mapAlert above. This asserts the documented behavior: only
// active alerts survive, expired/removed are excluded.
describe('rendered-map status predicate', () => {
  const isRenderable = (a: Alert) => a.status === 'active';

  it('includes active, excludes expired and removed', () => {
    const active = mapAlert(rawAlert({ status: 'ACTIVE' }));
    const expired = mapAlert(rawAlert({ status: 'EXPIRED' }));
    const removed = mapAlert(rawAlert({ status: 'REMOVED' }));

    expect([active, expired, removed].filter(isRenderable)).toEqual([active]);
  });
});
