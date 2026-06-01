import { Tabs, useRouter, usePathname } from 'expo-router';
import { Alert, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { Header } from '@/components/shared/Header';
import { FAB } from '@/components/shared/FAB';
import { useAuthStore } from '@/store/auth.store';
import { useMapStore } from '@/store/map.store';
import { COLORS } from '@/constants/colors';
import { FONT, SHADOW } from '@/constants/theme';
import { FEATURES } from '@/constants/config';
import { liveTabAction } from '@/lib/featureGuards';
import api from '@/services/api';

export default function TabsLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = !!user;
  const triggerLocate = useMapStore((s) => s.triggerLocate);
  const [unreadCount, setUnreadCount] = useState(0);

  const isOnMap = pathname === '/carte' || pathname.endsWith('/carte/index') || pathname === '/';

  // MVP-01 — register Expo push token with backend
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') return;
      let token: string;
      try {
        token = (await Notifications.getExpoPushTokenAsync()).data;
      } catch {
        return; // pas de projectId EAS en dev local — push notifications désactivées
      }
      await api.patch('/api/v1/users/me/push-token', { expo_push_token: token });
    })();
  }, [user?.id]);

  // MVP-03 — fetch unread notification count
  useEffect(() => {
    if (!user) return;
    api.get('/api/v1/users/me/notifications').then((res) => {
      const items: { is_read: boolean }[] = res.data.items ?? [];
      const unread = items.filter((n) => !n.is_read).length;
      setUnreadCount(unread);
    }).catch(() => {}); // silencieux si endpoint pas encore dispo
  }, [user?.id]);

  function handleFABPress() {
    if (isAuthenticated) {
      router.push('/signalement');
    } else {
      router.push('/auth/connexion');
    }
  }

  function handleNotificationPress() {
    router.push('/(tabs)/alertes');
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.fond }} edges={['top']}>
      <Header showNotification={isAuthenticated} onNotificationPress={handleNotificationPress} notificationCount={unreadCount} />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: COLORS.turquoise,
          tabBarInactiveTintColor: COLORS.textSecondary,
          tabBarStyle: {
            backgroundColor: COLORS.surface,
            borderTopColor: COLORS.border,
            borderTopWidth: 1,
            height: 64,
            paddingTop: 8,
          },
          tabBarLabelStyle: { fontFamily: FONT.medium, fontSize: 11 },
        }}
      >
        <Tabs.Screen
          name="carte/index"
          options={{
            title: 'Map',
            tabBarIcon: ({ color, size }) => <Ionicons name="map-outline" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="live/index"
          options={{
            title: 'Live',
            tabBarIcon: ({ color, size }) => <Ionicons name="musical-notes-outline" size={size} color={color} />,
          }}
          listeners={{
            tabPress: (e) => {
              // Live screen isn't built yet — while the flag is off, intercept
              // the tap and show a "coming soon" notice instead of navigating.
              if (liveTabAction(FEATURES.LIVE_ENABLED) === 'coming-soon') {
                e.preventDefault();
                Alert.alert('Live', 'Bientôt disponible');
              }
            },
          }}
        />
        <Tabs.Screen
          name="alertes/index"
          options={{
            title: 'Alertes',
            tabBarIcon: ({ color, size }) => <Ionicons name="notifications-outline" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="profil/index"
          options={{
            title: 'Profil',
            tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
          }}
        />
      </Tabs>

      {isOnMap && <FAB onPress={handleFABPress} />}

      {isOnMap && (
        <TouchableOpacity style={styles.locateButton} onPress={triggerLocate} activeOpacity={0.85}>
          <Ionicons name="locate" size={22} color={COLORS.turquoiseDark} />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Bas-gauche, à l'opposé du FAB « signaler » (bas-droite).
  locateButton: {
    position: 'absolute',
    bottom: 96,
    left: 20,
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW.soft,
  },
});
