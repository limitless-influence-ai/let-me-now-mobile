import api from './api';
import { AuthTokens, User } from '@/types/user.types';

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
    await api.post('/api/v1/auth/register', { email, pseudo, password });
  },

  login: async (email: string, password: string): Promise<{ user: User; tokens: AuthTokens }> => {
    const { data: tokenRaw } = await api.post('/api/v1/auth/login', { email, password });
    const tokens = mapTokens(tokenRaw);
    const { data: userRaw } = await api.get('/api/v1/users/me', {
      headers: { Authorization: `Bearer ${tokens.accessToken}` },
    });
    return { user: mapUser(userRaw), tokens };
  },

  fetchMe: async (): Promise<User> => {
    const { data } = await api.get('/api/v1/users/me');
    return mapUser(data);
  },

  refresh: async (refreshToken: string): Promise<AuthTokens> => {
    const { data } = await api.post('/api/v1/auth/refresh', { refresh_token: refreshToken });
    return mapTokens(data);
  },

  logout: async (refreshToken: string): Promise<void> => {
    await api.post('/api/v1/auth/logout', { refresh_token: refreshToken });
  },

  deleteAccount: async (): Promise<void> => {
    await api.delete('/api/v1/users/me');
  },
};
