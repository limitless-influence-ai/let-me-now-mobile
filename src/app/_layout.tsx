import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Sentry from '@sentry/react-native';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { useAuthStore } from '@/store/auth.store';
import * as SecureStore from 'expo-secure-store';
import { authService } from '@/services/auth.service';
import { useLocationSync } from '@/hooks/useLocationSync';
import { initSentry } from '@/lib/sentry';
import { COLORS } from '@/constants/colors';

const PROTECTED_SEGMENTS = ['signalement'];
const PROTECTED_TABS = ['alertes', 'profil'];

// Initialize error reporting once, at module load (no-op when DSN is unset).
initSentry();

function RootLayout() {
  const { user, isLoading, setUser, setTokens, setLoading } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // Sync the user's position to the backend for proximity push geo-filtering.
  useLocationSync();

  useEffect(() => {
    async function restoreSession() {
      try {
        const refreshToken = await SecureStore.getItemAsync('refresh_token');
        if (!refreshToken) return;
        const newTokens = await authService.refresh(refreshToken);
        await SecureStore.setItemAsync('access_token', newTokens.accessToken);
        setTokens(newTokens);
        const me = await authService.fetchMe();
        setUser(me);
      } catch {
        await SecureStore.deleteItemAsync('access_token');
        await SecureStore.deleteItemAsync('refresh_token');
      } finally {
        setLoading(false);
      }
    }
    restoreSession();
  }, []);

  useEffect(() => {
    if (isLoading) return;
    const segs = segments as string[];
    const inProtectedSegment = PROTECTED_SEGMENTS.includes(segs[0]);
    const inProtectedTab = segs[0] === '(tabs)' && PROTECTED_TABS.includes(segs[1]);
    if ((inProtectedSegment || inProtectedTab) && !user) {
      router.replace('/auth/connexion');
    }
  }, [segments, user, isLoading]);

  // Hold the splash (blank) until Inter is ready so the UI never flashes in a
  // fallback font.
  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: COLORS.fond } }} />
    </SafeAreaProvider>
  );
}

export default Sentry.wrap(RootLayout);
