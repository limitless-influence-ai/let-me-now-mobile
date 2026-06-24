import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusIndicator } from './StatusIndicator';
import { COLORS } from '@/constants/colors';
import { FONT, RADIUS } from '@/constants/theme';

interface Props {
  connected: boolean;
  refreshing?: boolean;
  count: number;
  /** Sous-titre de zone (ex : « Ligne 1 · RER A — rayon 500 m »). */
  zoneLabel: string;
  updatedLabel?: string;
}

/** [Accueil] Hero — résumé de proximité : gros compteur + statut temps réel. */
export function HeroProximity({ connected, refreshing, count, zoneLabel, updatedLabel }: Props) {
  const calm = count === 0;
  return (
    <View style={styles.hero}>
      <View style={styles.top}>
        <View style={styles.locRow}>
          <Ionicons name="location-outline" size={15} color={COLORS.textSecondary} />
          <Text style={styles.loc}>Autour de toi</Text>
        </View>
        <StatusIndicator connected={connected} refreshing={refreshing} updatedLabel={updatedLabel} />
      </View>
      <View style={styles.countRow}>
        <Text style={[styles.num, { color: calm ? COLORS.cactus : COLORS.noir }]}>{count}</Text>
        <Text style={styles.label}>
          {calm ? 'tout est calme\ndans ta zone' : `${count > 1 ? 'alertes actives' : 'alerte active'}\ndans ta zone`}
        </Text>
      </View>
      <Text style={styles.sub}>{zoneLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.card, padding: 20 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  loc: { fontFamily: FONT.medium, fontSize: 13, color: COLORS.textSecondary },
  countRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  num: { fontFamily: FONT.bold, fontSize: 54, lineHeight: 56, letterSpacing: -1 },
  label: { fontFamily: FONT.semibold, fontSize: 16, color: COLORS.grisTexte, lineHeight: 20, flexShrink: 1 },
  sub: { fontFamily: FONT.regular, fontSize: 13, color: COLORS.textSecondary, marginTop: 14 },
});
