/**
 * [V1.5] Helpers purs pour l'upload de photo (avatar + photo d'alerte).
 *
 * L'upload réel passe par MinIO (dev) / Cloudflare R2 (prod) côté backend,
 * derrière FEATURE_PHOTO_UPLOAD_ENABLED. Ces helpers restent sans effet de bord
 * (testables) : construction de la part multipart + interprétation des erreurs
 * normalisées du backend (error_code / status).
 */

/** Sous-ensemble d'un asset expo-image-picker dont on a besoin pour l'upload. */
export interface PickedImage {
  uri: string;
  mimeType?: string | null;
  fileName?: string | null;
}

/** Part multipart `file` attendue par axios/React Native ({ uri, name, type }). */
export interface PhotoFilePart {
  uri: string;
  name: string;
  type: string;
}

const _EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/**
 * Construit la part `file` (uri/name/type) depuis un asset image-picker.
 * Le type MIME par défaut est image/jpeg ; le nom est dérivé du type (jamais
 * d'un nom de fichier arbitraire fourni par l'OS).
 */
export function buildPhotoFilePart(asset: PickedImage): PhotoFilePart {
  const type = asset.mimeType && _EXT_BY_MIME[asset.mimeType] ? asset.mimeType : 'image/jpeg';
  const ext = _EXT_BY_MIME[type] ?? 'jpg';
  const name = asset.fileName && /\.[a-z0-9]+$/i.test(asset.fileName) ? asset.fileName : `photo.${ext}`;
  return { uri: asset.uri, name, type };
}

/** FormData prête pour POST multipart (`file` = part image). */
export function buildPhotoFormData(asset: PickedImage): FormData {
  const form = new FormData();
  // En React Native, la valeur est l'objet { uri, name, type } (cast `any`
  // car le typage DOM de FormData attend Blob/string).
  form.append('file', buildPhotoFilePart(asset) as unknown as Blob);
  return form;
}

interface NormalizedErrorShape {
  response?: { status?: number; data?: { error_code?: string } };
}

function errorCode(err: unknown): string | undefined {
  return (err as NormalizedErrorShape)?.response?.data?.error_code;
}

function httpStatus(err: unknown): number | undefined {
  return (err as NormalizedErrorShape)?.response?.status;
}

/**
 * True si l'upload n'est pas disponible côté serveur : flag éteint
 * (501 AVATAR_UPLOAD_NOT_AVAILABLE pour l'avatar, 404 require_feature pour la
 * photo d'alerte). Le client affiche alors « bientôt disponible » sans crash.
 */
export function isUploadUnavailable(err: unknown): boolean {
  return (
    errorCode(err) === 'AVATAR_UPLOAD_NOT_AVAILABLE' ||
    httpStatus(err) === 501 ||
    httpStatus(err) === 404
  );
}

/** Message FR clair pour une erreur d'upload (jamais [object Object]). */
export function uploadErrorMessage(err: unknown): string {
  switch (errorCode(err)) {
    case 'AVATAR_UPLOAD_NOT_AVAILABLE':
      return "L'upload de photo n'est pas encore disponible.";
    case 'UPLOAD_INVALID_TYPE':
      return 'Format non supporté. Utilisez une image (JPEG, PNG ou WebP).';
    case 'UPLOAD_TOO_LARGE':
      return 'Image trop volumineuse. Choisissez un fichier plus léger.';
    case 'UPLOAD_FAILED':
      return "Échec de l'envoi de l'image. Réessayez.";
    default:
      if (httpStatus(err) === 404 || httpStatus(err) === 501) {
        return "L'upload de photo n'est pas encore disponible.";
      }
      return "Impossible d'envoyer l'image. Réessayez.";
  }
}
