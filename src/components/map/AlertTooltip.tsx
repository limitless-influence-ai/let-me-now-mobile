import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { Alert } from '@/types/alert.types';
import { COLORS } from '@/constants/colors';
import { FONT, RADIUS, SHADOW } from '@/constants/theme';
import { Badge } from '@/components/ui/Badge';

interface Props {
  alert: Alert;
  onOpenDetail: (alert: Alert) => void;
  onDismiss: () => void;
}

function countdown(expiresAt: string | null): string | null {
  if (!expiresAt) return null;
  const diffMin = Math.floor((new Date(expiresAt).getTime() - Date.now()) / 60000);
  if (diffMin <= 0) return null;
  return diffMin < 60 ? `Expire dans ${diffMin} min` : `Expire dans ${Math.floor(diffMin / 60)} h`;
}

/** Tooltip carte — petite card flottante au-dessus du pin tapé. */
export function AlertTooltip({ alert, onOpenDetail, onDismiss }: Props) {
  const cd = countdown(alert.expiresAt);
  return (
    <Marker
      coordinate={{ latitude: alert.lat, longitude: alert.lon }}
      anchor={{ x: 0.5, y: 1.05 }}
      tracksViewChanges={false}
      onPress={onDismiss}
    >
      <View style={styles.card}>
        <Badge type={alert.type} />
        <Text style={styles.location} numberOfLines={1}>{alert.locationLabel}</Text>
        {cd && (
          <View style={styles.cdRow}>
            <Ionicons name="time-outline" size={13} color={COLORS.corail} />
            <Text style={styles.cd}>{cd}</Text>
          </View>
        )}
        <TouchableOpacity style={styles.btn} onPress={() => onOpenDetail(alert)} activeOpacity={0.8}>
          <Text style={styles.btnText}>Voir le détail</Text>
          <Ionicons name="chevron-forward" size={16} color={COLORS.noir} />
        </TouchableOpacity>
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.card, padding: 14, width: 230, ...SHADOW.soft },
  location: { fontFamily: FONT.regular, fontSize: 12, color: COLORS.textSecondary, marginTop: 8 },
  cdRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },
  cd: { fontFamily: FONT.semibold, fontSize: 12, color: COLORS.corail },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 12,
    height: 40,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.btn,
  },
  btnText: { fontFamily: FONT.semibold, fontSize: 14, color: COLORS.noir },
});
