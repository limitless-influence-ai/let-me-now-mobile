import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/colors';
import { FONT, RADIUS } from '@/constants/theme';

/** Pastille « En direct » avec halo pulsé (connecté). */
function LiveDot() {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(pulse, { toValue: 1, duration: 1600, useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 3.2] });
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.7, 0] });
  return (
    <View style={styles.dotWrap}>
      <Animated.View style={[styles.dotRing, { transform: [{ scale }], opacity }]} />
      <View style={styles.dotCore} />
    </View>
  );
}

interface Props {
  connected: boolean;
  refreshing?: boolean;
  /** Libellé daté affiché au visiteur (ex : « Mis à jour à 9:41 »). */
  updatedLabel?: string;
}

/**
 * [Accueil] Indicateur temps réel : connecté → « En direct » (pulsé),
 * visiteur → instantané daté, pendant un refresh → spinner.
 */
export function StatusIndicator({ connected, refreshing, updatedLabel }: Props) {
  if (refreshing) {
    return (
      <View style={[styles.pill, styles.instant]}>
        <ActivityIndicator size="small" color={COLORS.turquoiseDark} />
        <Text style={styles.instantTxt}>Actualisation…</Text>
      </View>
    );
  }
  if (connected) {
    return (
      <View style={[styles.pill, styles.live]}>
        <LiveDot />
        <Text style={styles.liveTxt}>En direct</Text>
      </View>
    );
  }
  return (
    <View style={[styles.pill, styles.instant]}>
      <Ionicons name="time-outline" size={13} color={COLORS.grisTexte} />
      <Text style={styles.instantTxt}>{updatedLabel ?? 'Mis à jour'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: RADIUS.pill, paddingVertical: 5, paddingHorizontal: 11 },
  live: { backgroundColor: 'rgba(79,195,199,0.12)' },
  liveTxt: { fontFamily: FONT.bold, fontSize: 12, color: COLORS.turquoiseDark },
  instant: { backgroundColor: COLORS.fond, borderWidth: 1, borderColor: COLORS.border, gap: 6 },
  instantTxt: { fontFamily: FONT.semibold, fontSize: 12, color: COLORS.grisTexte },
  dotWrap: { width: 8, height: 8, alignItems: 'center', justifyContent: 'center' },
  dotRing: { position: 'absolute', width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.turquoise },
  dotCore: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.turquoise },
});
