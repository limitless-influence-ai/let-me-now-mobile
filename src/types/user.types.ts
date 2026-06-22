export type Gender = 'MALE' | 'FEMALE' | 'NON_BINARY' | 'PREFER_NOT_TO_SAY';

export interface User {
  id: string;
  email: string;
  pseudo: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  score: number;
  isVerified: boolean;
  // [V1.5 #8] État de bannissement. `bannedUntil` est la date de fin (ISO) ;
  // le ban est actif tant qu'elle est dans le futur (voir lib/banState).
  isBanned: boolean;
  bannedUntil: string | null;
  // [V1.5] Éligibilité au changement de pseudo. `pseudoNextChangeAt` (ISO) est la
  // date de prochaine éligibilité ; null = modifiable tout de suite (voir lib/pseudoCooldown).
  pseudoChangedAt: string | null;
  pseudoNextChangeAt: string | null;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// [V1.5] Préférences de notification (persistées côté backend, derrière
// FEATURE_NOTIF_PREFERENCES_ENABLED). notifRadiusM borné 300–1000.
export interface NotifPreferences {
  notifAgression: boolean;
  notifHomophobe: boolean;
  notifPickpocket: boolean;
  notifCactus: boolean;
  notifRadiusM: number;
}
