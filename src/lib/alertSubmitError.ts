/**
 * Traduit une erreur de création d'alerte en message clair pour l'utilisateur.
 *
 * Garantit qu'on n'affiche jamais l'objet d'erreur brut ([object Object]).
 * Lit le format d'erreur normalisé du backend (`{ error_code, params, message }`)
 * et retombe sur le `detail` FastAPI historique puis sur des messages par code
 * de statut.
 *
 * [V1.5 #7] Le cas 409 = limite d'alertes actives atteinte.
 * [V1.5 #8] error_code `ACCOUNT_BANNED` = compte suspendu (params.banned_until).
 */
import { banMessage } from './banState';

export interface AlertSubmitErrorShape {
  response?: {
    status?: number;
    data?: {
      detail?: unknown;
      error_code?: unknown;
      message?: unknown;
      params?: Record<string, unknown>;
    };
  };
}

export function alertSubmitErrorMessage(err: unknown): string {
  const axErr = err as AlertSubmitErrorShape;
  const status = axErr?.response?.status;
  const data = axErr?.response?.data;
  const errorCode = typeof data?.error_code === 'string' ? data.error_code : undefined;
  // On préfère une string lisible : `detail` (legacy FastAPI) sinon le `message`
  // du format normalisé. On ignore tout ce qui n'est pas une string (ex: tableau
  // de validation 422) pour ne jamais rendre un objet.
  const rawDetail = data?.detail;
  const normalizedMessage = typeof data?.message === 'string' ? data.message : undefined;
  const detail = typeof rawDetail === 'string' ? rawDetail : normalizedMessage;

  // [V1.5 #8] Compte suspendu — message clair avec la date de fin de bannissement.
  // L'utilisateur reste libre de voter et de consulter les alertes.
  if (errorCode === 'ACCOUNT_BANNED') {
    const bannedUntil = typeof data?.params?.banned_until === 'string' ? data.params.banned_until : null;
    return banMessage(bannedUntil);
  }

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
