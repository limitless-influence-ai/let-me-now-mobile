/* eslint-env jest */
import { credibilityLabel, credibilityText } from '../credibility';

describe('credibilityLabel', () => {
  it('returns "Élevée" at or above 100 (default start)', () => {
    expect(credibilityLabel(100)).toBe('Élevée');
    expect(credibilityLabel(102)).toBe('Élevée');
  });

  it('returns "Correcte" between 30 and 99', () => {
    expect(credibilityLabel(99)).toBe('Correcte');
    expect(credibilityLabel(30)).toBe('Correcte');
  });

  it('returns "Faible" below 30 (ban threshold #6)', () => {
    expect(credibilityLabel(29)).toBe('Faible');
    expect(credibilityLabel(0)).toBe('Faible');
  });
});

describe('credibilityText', () => {
  it('combines the derived label with the raw score', () => {
    expect(credibilityText(102)).toBe('Élevée · 102');
    expect(credibilityText(29)).toBe('Faible · 29');
  });
});
