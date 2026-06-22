import {
  canEditPseudo,
  daysUntilEditable,
  cooldownMessage,
  isValidPseudo,
} from '../pseudoCooldown';

const NOW = new Date('2026-06-22T12:00:00.000Z');

describe('[V1.5] canEditPseudo', () => {
  it('null → modifiable tout de suite', () => {
    expect(canEditPseudo(null, NOW)).toBe(true);
  });

  it('date passée → modifiable', () => {
    expect(canEditPseudo('2026-06-20T12:00:00.000Z', NOW)).toBe(true);
  });

  it('date future → bloqué', () => {
    expect(canEditPseudo('2026-07-01T12:00:00.000Z', NOW)).toBe(false);
  });

  it('date invalide → modifiable (pas de blocage parasite)', () => {
    expect(canEditPseudo('pas-une-date', NOW)).toBe(true);
  });
});

describe('[V1.5] daysUntilEditable / cooldownMessage', () => {
  it('éligible → 0 jour', () => {
    expect(daysUntilEditable(null, NOW)).toBe(0);
  });

  it('9 jours restants (arrondi sup)', () => {
    // +8j12h → 9 jours arrondis au supérieur
    const next = '2026-06-30T23:00:00.000Z';
    expect(daysUntilEditable(next, NOW)).toBe(9);
    expect(cooldownMessage(next, NOW)).toBe('Modifiable dans 9 jours');
  });

  it('1 jour → singulier', () => {
    const next = '2026-06-23T06:00:00.000Z';
    expect(cooldownMessage(next, NOW)).toBe('Modifiable dans 1 jour');
  });
});

describe('[V1.5] isValidPseudo (2–50)', () => {
  it('trop court / trop long → invalide', () => {
    expect(isValidPseudo('a')).toBe(false);
    expect(isValidPseudo('y'.repeat(51))).toBe(false);
  });

  it('dans les bornes → valide', () => {
    expect(isValidPseudo('Al')).toBe(true);
    expect(isValidPseudo('z'.repeat(50))).toBe(true);
  });

  it('espaces non comptés (trim)', () => {
    expect(isValidPseudo('  a  ')).toBe(false);
  });
});
