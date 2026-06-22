import { isBanActive, formatBanUntil, banMessage } from '../banState';

const FUTURE = '2999-01-01T12:00:00.000Z';
const PAST = '2000-01-01T12:00:00.000Z';

describe('[V1.5 #8] isBanActive', () => {
  it('banni avec date de fin dans le futur -> actif', () => {
    expect(isBanActive({ isBanned: true, bannedUntil: FUTURE })).toBe(true);
  });

  it('banni mais date de fin dépassée -> inactif (expiration à la volée)', () => {
    expect(isBanActive({ isBanned: true, bannedUntil: PAST })).toBe(false);
  });

  it('non banni -> inactif même avec une date', () => {
    expect(isBanActive({ isBanned: false, bannedUntil: FUTURE })).toBe(false);
  });

  it('banned_until null -> inactif', () => {
    expect(isBanActive({ isBanned: true, bannedUntil: null })).toBe(false);
  });

  it('utilisateur null -> inactif (visiteur)', () => {
    expect(isBanActive(null)).toBe(false);
  });

  it('date invalide -> inactif (pas de crash)', () => {
    expect(isBanActive({ isBanned: true, bannedUntil: 'pas-une-date' })).toBe(false);
  });
});

describe('[V1.5 #8] formatBanUntil', () => {
  it('absente -> chaîne vide', () => {
    expect(formatBanUntil(null)).toBe('');
  });

  it('invalide -> chaîne vide (pas de crash)', () => {
    expect(formatBanUntil('xxx')).toBe('');
  });

  it('valide -> contient le jour et l\'heure', () => {
    const out = formatBanUntil('2026-06-24T14:32:00.000Z');
    expect(out).toContain('2026');
    expect(out).toContain('à');
  });
});

describe('[V1.5 #8] banMessage', () => {
  it('avec date -> raison + fin de bannissement + parcours encore possibles', () => {
    const msg = banMessage(FUTURE);
    expect(msg).toContain('suspendu');
    expect(msg).toContain('Fin du bannissement');
    expect(msg).toContain('voter');
    expect(msg).toContain('consulter');
  });

  it('sans date -> message clair sans « Fin du bannissement »', () => {
    const msg = banMessage(null);
    expect(msg).toContain('suspendu');
    expect(msg).not.toContain('Fin du bannissement');
    expect(msg).toContain('voter');
  });
});
