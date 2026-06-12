import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheet } from '@/components/shared/BottomSheet';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/types/alert.types';
import { COLORS } from '@/constants/colors';
import { FONT, RADIUS, SPACING, withAlpha } from '@/constants/theme';
import { FEATURES } from '@/constants/config';
import { isAlertTypeVisible } from '@/lib/featureGuards';

interface Props {
  alert: Alert | null;
  isAuthenticated: boolean;
  /** True when the current user authored this alert — the author cannot vote
   *  on their own alert (mirrors the backend 403 guard). */
  isOwnAlert?: boolean;
  voteError?: string | null;
  onClose: () => void;
  onConfirm: (alertId: string) => void;
  onInvalidate: (alertId: string) => void;
}

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "à l'instant";
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
  return `il y a ${Math.floor(diff / 86400)} j`;
}

function countdown(expiresAt: string | null): string | null {
  if (!expiresAt) return null;
  const diffMin = Math.floor((new Date(expiresAt).getTime() - Date.now()) / 60000);
  if (diffMin <= 0) return null;
  return diffMin < 60 ? `expire dans ${diffMin} min` : `expire dans ${Math.floor(diffMin / 60)} h`;
}

export function AlertDetailSheet({ alert, isAuthenticated, isOwnAlert, voteError, onClose, onConfirm, onInvalidate }: Props) {
  // Masquer la fiche pour un type désactivé par feature flag (Cactus).
  if (!alert || !isAlertTypeVisible(alert.type, FEATURES.CACTUS_ENABLED)) return null;

  const expired = alert.status === 'expired' || alert.status === 'removed';
  const cd = countdown(alert.expiresAt);

  return (
    <BottomSheet visible={!!alert} onClose={onClose}>
      <View style={[expired && styles.dim]}>
        {/* En-tête type + ancienneté */}
        <View style={styles.headerRow}>
          <Badge type={alert.type} size="lg" />
          <Text style={styles.time}>{timeAgo(alert.createdAt)}</Text>
        </View>

        {/* Statut */}
        {expired ? (
          <View style={[styles.statusBox, { backgroundColor: COLORS.fond }]}>
            <Ionicons name="time-outline" size={18} color={COLORS.textSecondary} />
            <Text style={[styles.statusText, { color: COLORS.textSecondary }]}>Alerte expirée</Text>
          </View>
        ) : (
          <View style={[styles.statusBox, { backgroundColor: withAlpha(COLORS.cactus, '1A') }]}>
            <View style={styles.dot} />
            <Text style={[styles.statusText, { color: COLORS.cactus }]}>
              Active{cd ? ` · ${cd}` : ''}
            </Text>
          </View>
        )}

        {/* Lieu + mini-carte */}
        <View style={styles.locRow}>
          <Ionicons name="location-outline" size={18} color={COLORS.noir} />
          <Text style={styles.locText}>{alert.locationLabel}</Text>
        </View>
        <View style={styles.miniMap}>
          <MapView
            style={StyleSheet.absoluteFill}
            initialRegion={{ latitude: alert.lat, longitude: alert.lon, latitudeDelta: 0.004, longitudeDelta: 0.004 }}
            scrollEnabled={false}
            zoomEnabled={false}
            pitchEnabled={false}
            rotateEnabled={false}
            pointerEvents="none"
          >
            <Marker coordinate={{ latitude: alert.lat, longitude: alert.lon }} />
          </MapView>
        </View>

        {/* Commentaire */}
        {alert.comment ? (
          <View style={styles.block}>
            <Text style={styles.blockLabel}>Commentaire</Text>
            <Text style={styles.comment}>{alert.comment}</Text>
          </View>
        ) : null}

        {/* Méta : rayon */}
        {alert.radiusM ? (
          <View style={styles.metaCard}>
            <Text style={styles.metaLabel}>Rayon de diffusion</Text>
            <Text style={styles.metaValue}>{alert.radiusM} m</Text>
          </View>
        ) : null}

        {voteError ? (
          <View style={styles.errBox}>
            <Ionicons name="alert-circle-outline" size={16} color={COLORS.agression} />
            <Text style={styles.errText}>{voteError}</Text>
          </View>
        ) : null}

        {/* Actions */}
        {!isAuthenticated ? (
          <View style={styles.visitorBox}>
            <Text style={styles.visitorText}>Connecte-toi pour confirmer ou invalider cette alerte.</Text>
          </View>
        ) : isOwnAlert ? (
          !expired && (
            <View style={styles.visitorBox}>
              <Text style={styles.visitorText}>C&apos;est votre alerte — vous ne pouvez pas voter dessus.</Text>
            </View>
          )
        ) : (
          !expired && (
            <View style={styles.voteRow}>
              <VoteButton
                kind="confirm"
                onPress={() => onConfirm(alert.id)}
              />
              <VoteButton
                kind="invalidate"
                onPress={() => onInvalidate(alert.id)}
              />
            </View>
          )
        )}
      </View>
    </BottomSheet>
  );
}

function VoteButton({ kind, onPress }: { kind: 'confirm' | 'invalidate'; onPress: () => void }) {
  const isConfirm = kind === 'confirm';
  const color = isConfirm ? COLORS.cactus : COLORS.grisTexte;
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.voteBtn, { borderColor: isConfirm ? COLORS.cactus : COLORS.border }]}
    >
      <Ionicons name={isConfirm ? 'thumbs-up-outline' : 'thumbs-down-outline'} size={20} color={color} />
      <Text style={[styles.voteLabel, { color }]}>{isConfirm ? 'Confirmer' : 'Invalider'}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  dim: { opacity: 0.9 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  time: { fontFamily: FONT.regular, fontSize: 12, color: COLORS.textSecondary },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginTop: SPACING.base,
  },
  dot: { width: 9, height: 9, borderRadius: 4.5, backgroundColor: COLORS.cactus },
  statusText: { fontFamily: FONT.semibold, fontSize: 14 },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: SPACING.base },
  locText: { fontFamily: FONT.semibold, fontSize: 16, color: COLORS.noir, flex: 1 },
  miniMap: { height: 140, borderRadius: RADIUS.card, overflow: 'hidden', marginTop: SPACING.sm, borderWidth: 1, borderColor: COLORS.border },
  block: { marginTop: SPACING.base },
  blockLabel: { fontFamily: FONT.medium, fontSize: 14, color: COLORS.grisTexte, marginBottom: 6 },
  comment: { fontFamily: FONT.regular, fontSize: 15, lineHeight: 22, color: COLORS.grisTexte },
  metaCard: { backgroundColor: COLORS.fond, borderRadius: RADIUS.card, padding: 14, marginTop: SPACING.base },
  metaLabel: { fontFamily: FONT.regular, fontSize: 12, color: COLORS.textSecondary },
  metaValue: { fontFamily: FONT.bold, fontSize: 18, color: COLORS.noir, marginTop: 2 },
  errBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFF5F5', padding: 12, borderRadius: 10, marginTop: SPACING.base },
  errText: { fontFamily: FONT.regular, fontSize: 13, color: COLORS.agression, flex: 1 },
  visitorBox: { backgroundColor: COLORS.fond, borderRadius: RADIUS.card, padding: 16, marginTop: SPACING.base },
  visitorText: { fontFamily: FONT.regular, fontSize: 13, color: COLORS.textSecondary, textAlign: 'center' },
  voteRow: { flexDirection: 'row', gap: 12, marginTop: SPACING.base },
  voteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 56,
    borderWidth: 1.5,
    borderRadius: RADIUS.btn,
  },
  voteLabel: { fontFamily: FONT.semibold, fontSize: 15 },
});
