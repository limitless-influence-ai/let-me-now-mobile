import { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS } from '@/constants/colors';
import { FONT } from '@/constants/theme';
import { useAuthStore } from '@/store/auth.store';
import { Logo } from '@/components/shared/Logo';

export default function SplashScreen() {
  const router = useRouter();
  const isLoading = useAuthStore((s) => s.isLoading);
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: 0.85,
      duration: 2000,
      useNativeDriver: false,
    }).start();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start(() => {
        router.replace('/(tabs)/carte');
      });
    }
  }, [isLoading]);

  const barWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <Logo height={180} />
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressBar, { width: barWidth }]} />
      </View>
      <Text style={styles.caption}>Vérification de la session…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.fond, alignItems: 'center', justifyContent: 'center' },
  progressTrack: { marginTop: 40, width: 200, height: 4, borderRadius: 2, backgroundColor: COLORS.border, overflow: 'hidden' },
  progressBar: { height: 4, borderRadius: 2, backgroundColor: COLORS.turquoise },
  caption: { fontFamily: FONT.regular, fontSize: 12, color: COLORS.textSecondary, marginTop: 14 },
});
