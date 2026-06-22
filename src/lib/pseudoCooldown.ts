/**
 * [V1.5] Cooldown de changement de pseudo — logique pure sortie du JSX.
 *
 * Le backend expose `pseudoNextChangeAt` (date de prochaine éligibilité, ISO) :
 * - null → modifiable tout de suite ;
 * - dans le futur → bouton grisé + « Modifiable dans X jours ».
 * On miroir ainsi la règle serveur (cooldown 14 j) pour griser sans tâtonner.
 */

const PSEUDO_MIN = 2;
const PSEUDO_MAX = 50;

/** True si le pseudo peut être modifié maintenant (pas de cooldown en cours). */
export function canEditPseudo(pseudoNextChangeAt: string | null, now: Date = new Date()): boolean {
  if (!pseudoNextChangeAt) return true;
  const next = new Date(pseudoNextChangeAt);
  if (isNaN(next.getTime())) return true;
  return next.getTime() <= now.getTime();
}

/** Jours restants avant la prochaine éligibilité (arrondi sup, min 1), 0 si éligible. */
export function daysUntilEditable(pseudoNextChangeAt: string | null, now: Date = new Date()): number {
  if (canEditPseudo(pseudoNextChangeAt, now)) return 0;
  const next = new Date(pseudoNextChangeAt as string);
  const ms = next.getTime() - now.getTime();
  return Math.max(1, Math.ceil(ms / 86_400_000));
}

/** Message d'indisponibilité, ex: « Modifiable dans 9 jours ». */
export function cooldownMessage(pseudoNextChangeAt: string | null, now: Date = new Date()): string {
  const days = daysUntilEditable(pseudoNextChangeAt, now);
  return `Modifiable dans ${days} jour${days > 1 ? 's' : ''}`;
}

/** Validation locale 2–50 caractères (alignée backend) avant tout envoi. */
export function isValidPseudo(pseudo: string): boolean {
  const len = pseudo.trim().length;
  return len >= PSEUDO_MIN && len <= PSEUDO_MAX;
}

export { PSEUDO_MIN, PSEUDO_MAX };
