import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Alert } from '@/types/alert.types';
import { COLORS } from '@/constants/colors';
import { FONT, RADIUS, ALERT_TYPE_META } from '@/constants/theme';

interface Props {
  alert: Alert;
  distanceM?: number;
  isRead?: boolean;
  onPress: (alert: Alert) => void;
  /** Affiche une corbeille à droite au lieu du point non-lu (onglet « Mes alertes »). */
  deletable?: boolean;
  onDelete?: (alert: Alert) => void;
}

function timeAgo(isoDate: string): string {
  const diff = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000);
  if (diff < 60) return "à l'instant";
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
  return `il y a ${Math.floor(diff / 86400)} j`;
}

function formatDistance(m?: number): string | null {
  if (m === undefined) return null;
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} m`;
}

function timeUntilExpiry(expiresAt: string | null): string | null {
  if (!expiresAt) return null;
  const diffMs = new Date(expiresAt).getTime() - Date.now();
  if (diffMs <= 0) return null;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 60) return `Expire dans ${diffMin} min`;
  return `Expire dans ${Math.floor(diffMin / 60)} h`;
}

/** Card d'alerte « Refined Street » — tuile emoji colorée + titre + sous-texte + compte à rebours. */
export function AlertCard({ alert, distanceM, isRead = true, onPress, deletable, onDelete }: Props) {
  const meta = ALERT_TYPE_META[alert.type];
  const isInactive = alert.status === 'expired' || alert.status === 'removed';
  const distance = formatDistance(distanceM);
  const sub = [distance, alert.locationLabel].filter(Boolean).join(' · ');
  const countdown = isInactive ? null : timeUntilExpiry(alert.expiresAt);

  return (
    <TouchableOpacity
      style={[styles.card, isInactive && styles.inactive]}
      onPress={() => onPress(alert)}
      activeOpacity={0.85}
    >
      <View style={[styles.tile, { backgroundColor: meta.color }]}>
        <Text style={styles.emoji}>{meta.emoji}</Text>
      </View>
      <View style={styles.body}>
        <View style={styles.top}>
          <Text style={styles.title} numberOfLines={1}>{meta.label}</Text>
          <Text style={styles.time}>{timeAgo(alert.createdAt)}</Text>
        </View>
        <Text style={styles.sub} numberOfLines={1}>{sub}</Text>
        {alert.status === 'expired' && <Text style={styles.statusExpired}>Expirée</Text>}
        {alert.status === 'removed' && <Text style={styles.statusRemoved}>Supprimée</Text>}
        {countdown && (
          <View style={styles.cdRow}>
            <Ionicons name="time-outline" size={13} color={COLORS.corail} />
            <Text style={styles.cd}>{countdown}</Text>
          </View>
        )}
      </View>
      {deletable ? (
        <TouchableOpacity onPress={() => onDelete?.(alert)} hitSlop={8} style={styles.trash}>
          <Ionicons name="trash-outline" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
      ) : (
        !isRead && <View style={styles.unread} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.card,
    backgroundColor: COLORS.surface,
  },
  inactive: { opacity: 0.55 },
  tile: { width: 44, height: 44, borderRadius: RADIUS.badge, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 22 },
  body: { flex: 1, minWidth: 0 },
  top: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 },
  title: { fontFamily: FONT.semibold, fontSize: 16, color: COLORS.noir, flexShrink: 1 },
  time: { fontFamily: FONT.regular, fontSize: 12, color: COLORS.textSecondary },
  sub: { fontFamily: FONT.regular, fontSize: 13, color: COLORS.textSecondary, marginTop: 3 },
  statusExpired: { fontFamily: FONT.semibold, fontSize: 12, color: COLORS.textSecondary, marginTop: 5 },
  statusRemoved: { fontFamily: FONT.semibold, fontSize: 12, color: COLORS.agression, marginTop: 5 },
  cdRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 7 },
  cd: { fontFamily: FONT.semibold, fontSize: 12, color: COLORS.corail },
  unread: { width: 9, height: 9, borderRadius: 4.5, backgroundColor: COLORS.turquoise, marginTop: 4 },
  trash: { alignSelf: 'center', padding: 2 },
});
