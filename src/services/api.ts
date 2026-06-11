import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '@/store/auth.store';

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 10_000,
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    console.log(`[api] ${response.config.method?.toUpperCase()} ${response.config.url} → ${response.status}`);
    return response;
  },
  async (error) => {
    const status = error.response?.status;
    const detail = error.response?.data?.detail ?? error.response?.data;
    // console.warn (not console.error) so API failures are still logged for
    // debugging but never surface the red full-screen error overlay in the app.
    console.warn(`[api] ${error.config?.method?.toUpperCase()} ${error.config?.url} → ${status ?? 'ERR'} | ${JSON.stringify(detail)}`);

    const original = error.config;
    if (error.response?.status === 401 && !original._retry && !original.url?.includes('/auth/refresh')) {
      original._retry = true;
      const refreshToken = await SecureStore.getItemAsync('refresh_token');
      if (refreshToken) {
        try {
          const { data } = await axios.post(
            `${process.env.EXPO_PUBLIC_API_URL}/api/v1/auth/refresh`,
            { refresh_token: refreshToken },
          );
          await SecureStore.setItemAsync('access_token', data.access_token);
          // The backend rotates the refresh token on every refresh: the old one
          // was invalidated server-side, so we MUST persist the new one or the
          // next session would fail to refresh and force a logout.
          if (data.refresh_token) {
            await SecureStore.setItemAsync('refresh_token', data.refresh_token);
          }
          original.headers.Authorization = `Bearer ${data.access_token}`;
          return api(original);
        } catch {
          await SecureStore.deleteItemAsync('access_token');
          await SecureStore.deleteItemAsync('refresh_token');
          // Clear the in-memory Zustand store too — otherwise stale user/tokens
          // remain and the app keeps firing authenticated requests that 401-loop.
          useAuthStore.getState().logout();
        }
      }
    }
    return Promise.reject(error);
  },
);

export default api;
