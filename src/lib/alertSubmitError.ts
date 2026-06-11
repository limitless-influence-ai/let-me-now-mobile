/**
 * Traduit une erreur de création d'alerte en message clair pour l'utilisateur.
 *
 * Garantit qu'on n'affiche jamais l'objet d'erreur brut ([object Object]) :
 * on lit le `detail` renvoyé par le backend (FastAPI) et on retombe sur des
 * messages explicites par code de statut.
 *
 * [V1.5 #7] Le cas 409 = limite d'alertes actives atteinte.
 */

export interface AlertSubmitErrorShape {
  response?: { status?: number; data?: { detail?: unknown } };
}

export function alertSubmitErrorMessage(err: unknown): string {
  const axErr = err as AlertSubmitErrorShape;
  const status = axErr?.response?.status;
  const rawDetail = axErr?.response?.data?.detail;
  // Le detail FastAPI est une string ; on l'ignore s'il n'en est pas une
  // (ex: tableau de validation 422) pour ne jamais rendre un objet.
  const detail = typeof rawDetail === 'string' ? rawDetail : undefined;

  if (status === 401) {
    return 'Session expirée. Reconnectez-vous.';
  }
  if (status === 403) {
    return detail ?? 'Compte non vérifié ou suspendu.';
  }
  if (status === 409) {
    // Limite d'alertes actives atteinte — message du backend, repli explicite.
    return (
      detail ??
      "Limite d'alertes actives atteinte. Supprimez une alerte avant d'en créer une nouvelle."
    );
  }
  if (status === 422) {
    return `Données invalides (422): ${detail ?? 'vérifiez les champs du formulaire'}`;
  }
  return `Erreur ${status ?? 'réseau'} — ${detail ?? 'impossible de créer le signalement'}`;
}
