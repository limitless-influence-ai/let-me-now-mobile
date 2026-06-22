/**
 * [V1.5 #8] État de bannissement — logique pure sortie du JSX (clean code).
 *
 * Le backend pose `is_banned` + `banned_until` sur l'utilisateur. Un ban est
 * « actif » tant que `banned_until` est dans le futur : on miroir ainsi la garde
 * serveur `require_not_banned` (qui évalue `banned_until` en temps réel et gère
 * l'expiration du ban à la volée) pour griser le FAB **avant** même le refus du
 * serveur. Pendant un ban : signalement bloqué, mais vote et consultation
 * restent possibles (rien ici ne bloque ces parcours).
 */
import { User } from '@/types/user.types';

type BanFields = Pick<User, 'isBanned' | 'bannedUntil'>;

/** True si l'utilisateur est banni ET que la date de fin est encore dans le futur. */
export function isBanActive(user: BanFields | null, now: Date = new Date()): boolean {
  if (!user || !user.isBanned || !user.bannedUntil) return false;
  const until = new Date(user.bannedUntil);
  if (isNaN(until.getTime())) return false;
  return until.getTime() > now.getTime();
}

/** Date de fin lisible (ex: « 24/06/2026 à 14:32 »), ou '' si absente/invalide. */
export function formatBanUntil(bannedUntil: string | null): string {
  if (!bannedUntil) return '';
  const d = new Date(bannedUntil);
  if (isNaN(d.getTime())) return '';
  const date = d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const time = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  return `${date} à ${time}`;
}

/** Message complet affiché à l'utilisateur banni : raison + date de fin + ce qui reste possible. */
export function banMessage(bannedUntil: string | null): string {
  const until = formatBanUntil(bannedUntil);
  const reason = 'Votre compte est temporairement suspendu : vous ne pouvez pas créer de signalement.';
  const end = until ? ` Fin du bannissement : ${until}.` : '';
  const stillAllowed = ' Vous pouvez toujours voter et consulter les alertes.';
  return reason + end + stillAllowed;
}
