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
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
