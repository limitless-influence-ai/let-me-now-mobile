import { haversineM, formatDistanceM } from '../geo';

describe('haversineM', () => {
  it('is 0 for identical points', () => {
    expect(haversineM(48.8566, 2.3522, 48.8566, 2.3522)).toBe(0);
  });

  it('approximates a known short distance (~1.5 km Châtelet→Nation)', () => {
    const d = haversineM(48.8566, 2.3522, 48.8485, 2.3958);
    expect(d).toBeGreaterThan(3000);
    expect(d).toBeLessThan(3400);
  });
});

describe('formatDistanceM', () => {
  it('uses metres below 1 km', () => {
    expect(formatDistanceM(450)).toBe('450 m');
    expect(formatDistanceM(999)).toBe('999 m');
  });
  it('switches to km at/above 1 km', () => {
    expect(formatDistanceM(1000)).toBe('1.0 km');
    expect(formatDistanceM(1234)).toBe('1.2 km');
  });
});
