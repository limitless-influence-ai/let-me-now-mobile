import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/colors';
import { FONT, RADIUS } from '@/constants/theme';

interface Props {
  connected: boolean;
  onReport: () => void;
  onOpenMap: () => void;
}

/** [Accueil] Actions rapides : Signaler (noir = engagement) + Ouvrir la carte. */
export function QuickActions({ connected, onReport, onOpenMap }: Props) {
  return (
    <View style={styles.row}>
      <TouchableOpacity style={[styles.tile, styles.primary]} onPress={onReport} activeOpacity={0.85}>
        <View style={[styles.ico, styles.icoPrimary]}>
          <Ionicons name="add" size={20} color="#FFFFFF" />
        </View>
        <View>
          <Text style={styles.titlePrimary}>Signaler</Text>
          <View style={styles.capRow}>
            {!connected && <Ionicons name="lock-closed" size={11} color="rgba(255,255,255,0.75)" />}
            <Text style={styles.capPrimary}>{connected ? 'Créer une alerte' : 'Connexion requise'}</Text>
          </View>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.tile, styles.ghost]} onPress={onOpenMap} activeOpacity={0.85}>
        <View style={[styles.ico, styles.icoGhost]}>
          <Ionicons name="map-outline" size={20} color={COLORS.turquoiseDark} />
        </View>
        <View>
          <Text style={styles.titleGhost}>Ouvrir la carte</Text>
          <Text style={styles.capGhost}>Vue complète</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12 },
  tile: { flex: 1, borderRadius: RADIUS.btn, padding: 15, minHeight: 104, justifyContent: 'space-between', borderWidth: 1.5, borderColor: 'transparent' },
  primary: { backgroundColor: COLORS.noir },
  ghost: { backgroundColor: COLORS.surface, borderColor: COLORS.border },
  ico: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  icoPrimary: { backgroundColor: 'rgba(255,255,255,0.14)' },
  icoGhost: { backgroundColor: COLORS.fond },
  titlePrimary: { fontFamily: FONT.bold, fontSize: 15, color: '#FFFFFF' },
  titleGhost: { fontFamily: FONT.bold, fontSize: 15, color: COLORS.noir },
  capRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  capPrimary: { fontFamily: FONT.medium, fontSize: 11, color: 'rgba(255,255,255,0.75)' },
  capGhost: { fontFamily: FONT.medium, fontSize: 11, color: COLORS.textSecondary, marginTop: 3 },
});
