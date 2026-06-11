import { User, AuthTokens } from '@/types/user.types';
import { Alert, AlertCreate, AlertType } from '@/types/alert.types';

/**
 * DEMO MODE — offline mock layer for client presentations.
 *
 * When enabled, the service layer short-circuits EVERY network call and serves
 * deterministic in-memory data instead. The whole app then runs end-to-end with
 * zero backend / network dependency: login, map markers, alert lists, detail
 * sheet, "signaler une alerte", voting, profile and account actions all work
 * fully offline — immune to the dev-server IP / firewall pitfalls.
 *
 * Toggle: set `EXPO_PUBLIC_DEMO_MODE=1` in `.env`, then restart Metro with a
 * cleared cache (`npx expo start -c`) — `EXPO_PUBLIC_*` vars are inlined into
 * the JS bundle at build time, so a plain reload is not enough.
 *
 * ⚠️ Keep this OFF in production (leave the env var unset / `0`).
 */
export const DEMO_MODE = process.env.EXPO_PUBLIC_DEMO_MODE === '1';

/**
 * Credentials surfaced on the login screen. In demo mode ANY non-empty
 * email/password is accepted (so a typo never derails a live demo) — these are
 * simply what we pre-fill and display.
 */
export const DEMO_CREDENTIALS = {
  email: 'demo@lmk.app',
  password: 'demo1234',
} as const;

/** The pre-seeded demo presenter account. */
export const DEMO_USER: User = {
  id: 'demo-user-0001',
  email: DEMO_CREDENTIALS.email,
  pseudo: 'Alex Demo',
  firstName: 'Alex',
  lastName: 'Martin',
  avatarUrl: null,
  score: 142,
  isVerified: true,
  createdAt: '2026-01-15T09:00:00.000Z',
};

export const DEMO_TOKENS: AuthTokens = {
  accessToken: 'demo-access-token',
  refreshToken: 'demo-refresh-token',
};

const TWO_HOURS_MS = 2 * 60 * 60_000;

/**
 * Fixed anchor for the seeded demo alerts — Paris Expo Porte de Versailles.
 * The alerts are projected around THIS point (not the live GPS position), so
 * they stay put for an on-site demo. The map still centers on the real GPS.
 */
export const DEMO_ANCHOR = { lat: 48.8312, lon: 2.2875 };

/**
 * Mock alerts are defined as small lat/lon OFFSETS from a center point rather
 * than absolute coordinates — at render time they are projected around the
 * presenter's actual location, so the map looks populated no matter where the
 * demo is given. Offsets stay within ~±0.0024° (~250 m) so every marker falls
 * inside the default 500 m fetch radius and the initial map viewport.
 */
interface MockSpec {
  id: string;
  type: AlertType;
  dLat: number;
  dLon: number;
  locationLabel: string;
  comment: string | null;
  ageMin: number;
  radiusM: number;
  /** Authored by the demo account → surfaces under the "Mes alertes" tab. */
  mine: boolean;
}

const MOCK_SPECS: readonly MockSpec[] = [
  { id: 'demo-a1', type: 'PICKPOCKET', dLat: 0.0008, dLon: 0.0006, locationLabel: 'Station Châtelet', comment: 'Deux individus suspects près des portiques.', ageMin: 4, radiusM: 150, mine: false },
  { id: 'demo-a2', type: 'AGRESSION', dLat: -0.0011, dLon: 0.0013, locationLabel: 'Rue de Rivoli', comment: 'Altercation violente entre plusieurs personnes.', ageMin: 11, radiusM: 200, mine: false },
  { id: 'demo-a3', type: 'PICKPOCKET', dLat: 0.0017, dLon: -0.0009, locationLabel: 'Forum des Halles', comment: 'Vol à la tire repéré dans la foule.', ageMin: 17, radiusM: 120, mine: false },
  { id: 'demo-a4', type: 'AGRESSION_HOMOPHOBE', dLat: -0.0019, dLon: -0.0015, locationLabel: 'Place de la République', comment: 'Propos et gestes homophobes signalés.', ageMin: 26, radiusM: 250, mine: false },
  { id: 'demo-a5', type: 'PICKPOCKET', dLat: 0.0023, dLon: 0.0021, locationLabel: 'Quai RER ligne A', comment: 'Groupe ciblant visiblement les touristes.', ageMin: 33, radiusM: 180, mine: false },
  { id: 'demo-a6', type: 'AGRESSION', dLat: 0.0006, dLon: -0.0022, locationLabel: 'Boulevard de Sébastopol', comment: 'Bagarre en cours sur le trottoir.', ageMin: 42, radiusM: 220, mine: false },
  { id: 'demo-a7', type: 'PICKPOCKET', dLat: -0.0007, dLon: 0.0009, locationLabel: 'Bus ligne 38', comment: 'Pickpocket à bord du bus.', ageMin: 8, radiusM: 100, mine: true },
  { id: 'demo-a8', type: 'AGRESSION_HOMOPHOBE', dLat: -0.0024, dLon: 0.0006, locationLabel: 'Rue Saint-Denis', comment: 'Insultes homophobes répétées.', ageMin: 51, radiusM: 200, mine: true },
  // CACTUS is hidden while FEATURES.CACTUS_ENABLED is false, but kept here so
  // the demo has live data the moment that flag is flipped on.
  { id: 'demo-a9', type: 'CACTUS', dLat: 0.0004, dLon: 0.0011, locationLabel: 'Métro Les Halles', comment: 'Contrôleurs signalés à la sortie.', ageMin: 6, radiusM: 200, mine: false },
] as const;

/** Alerts created during the session via "signaler" — kept so they persist. */
const sessionCreated: Alert[] = [];

function specToAlert(spec: MockSpec, center: { lat: number; lon: number }, now: number): Alert {
  const createdMs = now - spec.ageMin * 60_000;
  const created = new Date(createdMs).toISOString();
  return {
    id: spec.id,
    userId: spec.mine ? DEMO_USER.id : `demo-author-${spec.id}`,
    type: spec.type,
    lat: center.lat + spec.dLat,
    lon: center.lon + spec.dLon,
    locationLabel: spec.locationLabel,
    status: 'active',
    createdAt: created,
    updatedAt: created,
    expiresAt: new Date(createdMs + TWO_HOURS_MS).toISOString(),
    comment: spec.comment,
    photoUrl: null,
    radiusM: spec.radiusM,
  };
}

/**
 * All active alerts projected around the FIXED demo anchor (Porte de Versailles),
 * session-created first. The `lat`/`lon` args (the live GPS position) are kept
 * for API parity but intentionally ignored — the seeded alerts stay anchored.
 */
export function buildMockAlerts(_lat: number, _lon: number): Alert[] {
  const now = Date.now();
  const seeded = MOCK_SPECS.map((s) => specToAlert(s, DEMO_ANCHOR, now));
  return [...sessionCreated, ...seeded];
}

/** Alerts authored by the demo account (the "Mes alertes" tab). */
export function buildMyMockAlerts(): Alert[] {
  const now = Date.now();
  const mine = MOCK_SPECS.filter((s) => s.mine).map((s) => specToAlert(s, DEMO_ANCHOR, now));
  return [...sessionCreated, ...mine];
}

/** Look up a single alert by id (session-created or seeded). */
export function findDemoAlert(id: string): Alert | null {
  const now = Date.now();
  const all = [...sessionCreated, ...MOCK_SPECS.map((s) => specToAlert(s, DEMO_ANCHOR, now))];
  return all.find((a) => a.id === id) ?? null;
}

/** Materialize a freshly "reported" alert and keep it for the rest of the session. */
export function registerDemoAlert(payload: AlertCreate): Alert {
  const now = Date.now();
  const iso = new Date(now).toISOString();
  const alert: Alert = {
    id: `demo-new-${now}`,
    userId: DEMO_USER.id,
    type: payload.type,
    lat: payload.lat,
    lon: payload.lon,
    locationLabel: payload.locationLabel,
    status: 'active',
    createdAt: iso,
    updatedAt: iso,
    expiresAt: new Date(now + TWO_HOURS_MS).toISOString(),
    comment: payload.comment ?? null,
    photoUrl: null,
    radiusM: payload.radiusM ?? 500,
  };
  sessionCreated.unshift(alert);
  return alert;
}

/** Drop a session-created alert (e.g. deleted from "Mes alertes"). */
export function removeDemoAlert(id: string): void {
  const i = sessionCreated.findIndex((a) => a.id === id);
  if (i >= 0) sessionCreated.splice(i, 1);
}

/** Test-only helper — clears alerts created during a session. */
export function resetDemoSession(): void {
  sessionCreated.length = 0;
}
