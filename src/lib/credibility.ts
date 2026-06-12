/**
 * [V1.5 #5] Libellé de crédibilité dérivé du score réel de l'utilisateur.
 *
 * Le score démarre à 100 ; il monte de +2 par alerte confirmée et descend de
 * −1 par alerte invalidée (backend, derrière FEATURE_SCORE_ENABLED). Un score
 * < 30 déclenchera un ban (#6) — d'où le seuil « Faible » à 30.
 *
 * Logique sortie du JSX (règle clean code : pas de logique inline dans l'écran).
 */
export function credibilityLabel(score: number): string {
  if (score >= 100) return 'Élevée';
  if (score >= 30) return 'Correcte';
  return 'Faible';
}

/** Texte complet affiché dans la pastille : « Élevée · 102 ». */
export function credibilityText(score: number): string {
  return `${credibilityLabel(score)} · ${score}`;
}
