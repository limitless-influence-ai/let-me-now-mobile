import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Slider from '@react-native-community/slider';
import { BottomSheet } from '@/components/shared/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Toggle } from '@/components/ui/Toggle';
import { ComingSoonBadge } from '@/components/ui/ComingSoonBadge';
import { COLORS } from '@/constants/colors';
import { CONFIG, FEATURES } from '@/constants/config';
import { FONT, RADIUS, SPACING, ALERT_TYPE_META, PREVIEW_ALERT_TYPE_META } from '@/constants/theme';

interface Filters {
  agression: boolean;
  homophobe: boolean;
  pickpocket: boolean;
  cactus: boolean;
  radiusM: number;
}

interface Props {
  visible: boolean;
  isAuthenticated: boolean;
  onClose: () => void;
  onApply: (filters: Filters) => void;
}

const DEFAULTS: Filters = {
  agression: true,
  homophobe: true,
  pickpocket: true,
  cactus: true,
  radiusM: CONFIG.DEFAULT_RADIUS_M,
};

export function FilterSheet({ visible, isAuthenticated, onClose, onApply }: Props) {
  const [filters, setFilters] = useState<Filters>(DEFAULTS);

  function toggle(key: keyof Omit<Filters, 'radiusM'>) {
    setFilters((f) => ({ ...f, [key]: !f[key] }));
  }

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>Filtrer les alertes</Text>
        <TouchableOpacity onPress={() => setFilters(DEFAULTS)} hitSlop={8}>
          <Text style={styles.reset}>Réinitialiser</Text>
        </TouchableOpacity>
      </View>

      {!isAuthenticated && (
        <View style={styles.notice}>
          <Text style={styles.noticeText}>Connecte-toi pour personnaliser tes filtres.</Text>
        </View>
      )}

      <View style={!isAuthenticated && styles.locked} pointerEvents={isAuthenticated ? 'auto' : 'none'}>
        <Text style={styles.sectionLabel}>Types affichés</Text>
        <TypeRow meta={ALERT_TYPE_META.AGRESSION} value={filters.agression} onToggle={() => toggle('agression')} />
        <TypeRow meta={ALERT_TYPE_META.AGRESSION_HOMOPHOBE} value={filters.homophobe} onToggle={() => toggle('homophobe')} />
        <TypeRow meta={ALERT_TYPE_META.PICKPOCKET} value={filters.pickpocket} onToggle={() => toggle('pickpocket')} />
        {FEATURES.CACTUS_ENABLED && (
          <TypeRow meta={ALERT_TYPE_META.CACTUS} value={filters.cactus} onToggle={() => toggle('cactus')} />
        )}
        {/* Types en preview — désactivés tant que leur flag est off. */}
        {!FEATURES.LOST_LUGGAGE_ENABLED && (
          <TypeRow meta={PREVIEW_ALERT_TYPE_META.LOST_LUGGAGE} value={false} onToggle={() => {}} comingSoon />
        )}
        {!FEATURES.ABDUCTION_ENABLED && (
          <TypeRow meta={PREVIEW_ALERT_TYPE_META.ABDUCTION} value={false} onToggle={() => {}} comingSoon />
        )}
        {!FEATURES.CHILD_SAFETY_ENABLED && (
          <TypeRow meta={PREVIEW_ALERT_TYPE_META.CHILD_SAFETY} value={false} onToggle={() => {}} comingSoon />
        )}

        <View style={styles.divider} />

        <View style={styles.radiusHeader}>
          <Text style={styles.sectionLabel}>Rayon</Text>
          <Text style={styles.radiusValue}>{filters.radiusM} m</Text>
        </View>
        <Slider
          minimumValue={CONFIG.MIN_RADIUS_M}
          maximumValue={CONFIG.MAX_RADIUS_M}
          step={50}
          value={filters.radiusM}
          onValueChange={(v) => setFilters((f) => ({ ...f, radiusM: Math.round(v) }))}
          minimumTrackTintColor={COLORS.turquoise}
          maximumTrackTintColor={COLORS.border}
          thumbTintColor={COLORS.turquoise}
        />
        <View style={styles.sliderLabels}>
          <Text style={styles.sliderLabel}>{CONFIG.MIN_RADIUS_M} m</Text>
          <Text style={styles.sliderLabel}>1 km</Text>
        </View>
      </View>

      <Button
        label="Appliquer"
        onPress={() => { onApply(filters); onClose(); }}
        disabled={!isAuthenticated}
        style={styles.apply}
      />
    </BottomSheet>
  );
}

function TypeRow({
  meta,
  value,
  onToggle,
  comingSoon,
}: {
  meta: { color: string; emoji: string; label: string };
  value: boolean;
  onToggle: () => void;
  comingSoon?: boolean;
}) {
  return (
    <View style={[styles.row, comingSoon && styles.rowComingSoon]}>
      <View style={styles.rowLeft}>
        <View style={[styles.tile, { backgroundColor: meta.color }]}>
          <Text style={styles.tileEmoji}>{meta.emoji}</Text>
        </View>
        <Text style={styles.rowLabel}>{meta.label}</Text>
        {comingSoon && <ComingSoonBadge label="Bientôt disponible" />}
      </View>
      <Toggle value={comingSoon ? false : value} onValueChange={onToggle} disabled={comingSoon} />
    </View>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 },
  title: { fontFamily: FONT.semibold, fontSize: 18, color: COLORS.noir },
  reset: { fontFamily: FONT.medium, fontSize: 13, color: COLORS.textSecondary },
  notice: { backgroundColor: COLORS.fond, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 6 },
  noticeText: { fontFamily: FONT.regular, fontSize: 13, color: COLORS.textSecondary },
  locked: { opacity: 0.5 },
  sectionLabel: { fontFamily: FONT.medium, fontSize: 14, color: COLORS.grisTexte, marginTop: 8 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14 },
  rowComingSoon: { opacity: 0.5 },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  tile: { width: 32, height: 32, borderRadius: RADIUS.badge, alignItems: 'center', justifyContent: 'center' },
  tileEmoji: { fontSize: 16 },
  rowLabel: { fontFamily: FONT.regular, fontSize: 16, color: COLORS.noir },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.base },
  radiusHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  radiusValue: { fontFamily: FONT.semibold, fontSize: 13, color: COLORS.turquoiseDark },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  sliderLabel: { fontFamily: FONT.regular, fontSize: 12, color: COLORS.textSecondary },
  apply: { marginTop: SPACING.lg },
});
