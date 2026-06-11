import {
  DEMO_MODE,
  DEMO_USER,
  DEMO_ANCHOR,
  buildMockAlerts,
  buildMyMockAlerts,
  findDemoAlert,
  registerDemoAlert,
  removeDemoAlert,
  resetDemoSession,
} from '../mock';

const CENTER = { lat: 48.85, lon: 2.35 };

describe('demo mock layer', () => {
  beforeEach(() => resetDemoSession());

  it('is OFF by default (env unset) — never ships demo data to prod accidentally', () => {
    expect(DEMO_MODE).toBe(false);
  });

  describe('buildMockAlerts', () => {
    it('anchors every seeded alert at the fixed demo location, ignoring GPS', () => {
      const alerts = buildMockAlerts(CENTER.lat, CENTER.lon);
      expect(alerts.length).toBeGreaterThan(0);
      for (const a of alerts) {
        expect(Math.abs(a.lat - DEMO_ANCHOR.lat)).toBeLessThan(0.003);
        expect(Math.abs(a.lon - DEMO_ANCHOR.lon)).toBeLessThan(0.003);
      }
    });

    it('returns only active alerts with valid radii', () => {
      const alerts = buildMockAlerts(CENTER.lat, CENTER.lon);
      for (const a of alerts) {
        expect(a.status).toBe('active');
        expect(a.radiusM).toBeGreaterThan(0);
      }
    });

    it('stays anchored even when called from a different GPS position', () => {
      const a = buildMockAlerts(40, -74)[0];
      expect(Math.abs(a.lat - DEMO_ANCHOR.lat)).toBeLessThan(0.003);
      expect(Math.abs(a.lon - DEMO_ANCHOR.lon)).toBeLessThan(0.003);
    });
  });

  describe('buildMyMockAlerts', () => {
    it('returns only alerts authored by the demo account', () => {
      buildMockAlerts(CENTER.lat, CENTER.lon); // sets the center
      const mine = buildMyMockAlerts();
      expect(mine.length).toBeGreaterThan(0);
      for (const a of mine) {
        expect(a.userId).toBe(DEMO_USER.id);
      }
    });
  });

  describe('session-created alerts', () => {
    it('persists a reported alert into the around + mine feeds, then removes it', () => {
      const created = registerDemoAlert({
        type: 'PICKPOCKET',
        lat: CENTER.lat,
        lon: CENTER.lon,
        locationLabel: 'Test',
      });

      expect(buildMockAlerts(CENTER.lat, CENTER.lon).map((a) => a.id)).toContain(created.id);
      expect(buildMyMockAlerts().map((a) => a.id)).toContain(created.id);
      expect(findDemoAlert(created.id)?.id).toBe(created.id);

      removeDemoAlert(created.id);
      expect(buildMyMockAlerts().map((a) => a.id)).not.toContain(created.id);
    });
  });
});
