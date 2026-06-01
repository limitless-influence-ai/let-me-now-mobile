import { useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '@/store/auth.store';
import { authService } from '@/services/auth.service';

export function useAuth() {
  const { user, tokens, isLoading, setTokens, setLoading, logout } = useAuthStore();

  useEffect(() => {
    async function restoreSession() {
      try {
        const refreshToken = await SecureStore.getItemAsync('refresh_token');
        if (!refreshToken) return;
        const newTokens = await authService.refresh(refreshToken);
        await SecureStore.setItemAsync('access_token', newTokens.accessToken);
        setTokens(newTokens);
      } catch {
        await SecureStore.deleteItemAsync('access_token');
        await SecureStore.deleteItemAsync('refresh_token');
      } finally {
        setLoading(false);
      }
    }
    restoreSession();
  }, []);

  return { user, tokens, isLoading, isAuthenticated: !!user, logout };
}
