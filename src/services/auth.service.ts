import api from './api';
import { AuthTokens, User } from '@/types/user.types';
import { DEMO_MODE, DEMO_USER, DEMO_TOKENS } from '@/demo/mock';

function mapTokens(raw: { access_token: string; refresh_token: string }): AuthTokens {
  return { accessToken: raw.access_token, refreshToken: raw.refresh_token };
}

function mapUser(raw: Record<string, unknown>): User {
  return {
    id: raw.id as string,
    email: raw.email as string,
    pseudo: raw.pseudo as string,
    firstName: (raw.first_name as string | null) ?? null,
    lastName: (raw.last_name as string | null) ?? null,
    avatarUrl: (raw.avatar_url as string | null) ?? null,
    score: raw.score as number,
    isVerified: raw.is_verified as boolean,
    createdAt: raw.created_at as string,
  };
}

export const authService = {
  register: async (email: string, pseudo: string, password: string): Promise<void> => {
    if (DEMO_MODE) return;
    await api.post('/api/v1/auth/register', { email, pseudo, password });
  },

  login: async (email: string, password: string): Promise<{ user: User; tokens: AuthTokens }> => {
    // Demo mode: accept any non-empty credentials and return the demo account.
    if (DEMO_MODE) return { user: { ...DEMO_USER }, tokens: { ...DEMO_TOKENS } };
    const { data: tokenRaw } = await api.post('/api/v1/auth/login', { email, password });
    const tokens = mapTokens(tokenRaw);
    const { data: userRaw } = await api.get('/api/v1/users/me', {
      headers: { Authorization: `Bearer ${tokens.accessToken}` },
    });
    return { user: mapUser(userRaw), tokens };
  },

  fetchMe: async (): Promise<User> => {
    if (DEMO_MODE) return { ...DEMO_USER };
    const { data } = await api.get('/api/v1/users/me');
    return mapUser(data);
  },

  refresh: async (refreshToken: string): Promise<AuthTokens> => {
    if (DEMO_MODE) return { ...DEMO_TOKENS };
    const { data } = await api.post('/api/v1/auth/refresh', { refresh_token: refreshToken });
    return mapTokens(data);
  },

  logout: async (refreshToken: string): Promise<void> => {
    if (DEMO_MODE) return;
    await api.post('/api/v1/auth/logout', { refresh_token: refreshToken });
  },

  deleteAccount: async (): Promise<void> => {
    if (DEMO_MODE) return;
    await api.delete('/api/v1/users/me');
  },

  // Dev-only: verify an account without the email link (no SMTP locally).
  // Backend hard-disables this when ENV=production (returns 404).
  devVerifyEmail: async (email: string): Promise<void> => {
    if (DEMO_MODE) return;
    await api.post('/api/v1/auth/dev-verify', { email });
  },
};
