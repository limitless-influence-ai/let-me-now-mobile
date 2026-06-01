import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  FlatList,
  TextInput,
  ActivityIndicator,
  Alert as RNAlert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker } from 'react-native-maps';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { ComingSoonBadge } from '@/components/ui/ComingSoonBadge';
import { useAlerts } from '@/hooks/useAlerts';
import { useLocation } from '@/hooks/useLocation';
import { reverseGeocode } from '@/services/geocoding.service';
import { AlertType } from '@/types/alert.types';
import { COLORS } from '@/constants/colors';
import { FONT, RADIUS, SPACING, TEXT, ALERT_TYPE_META, PREVIEW_ALERT_TYPE_META } from '@/constants/theme';
import { FEATURES } from '@/constants/config';
import { isAlertTypeVisible } from '@/lib/featureGuards';

// Types en preview (non signalables) listés sous les types actifs, désactivés.
const PREVIEW_TYPES = Object.values(PREVIEW_ALERT_TYPE_META);

const ALL_ALERT_TYPES: { label: string; value: AlertType }[] = [
  { label: 'Agression', value: 'AGRESSION' },
  { label: 'Agression homophobe', value: 'AGRESSION_HOMOPHOBE' },
  { label: 'Pickpocket', value: 'PICKPOCKET' },
  { label: 'Cactus (contrôleurs)', value: 'CACTUS' },
];

// Cactus is filtered out while its feature flag is off, so users can't report
// an alert type that is hidden everywhere else in the UI.
const ALERT_TYPES = ALL_ALERT_TYPES.filter((t) => isAlertTypeVisible(t.value, FEATURES.CACTUS_ENABLED));

export default function SignalementScreen() {
  const router = useRouter();
  const { createAlert } = useAlerts();
  const { lat, lon, loading, error: locationError, isApproximate } = useLocation();
  const [selectedType, setSelectedType] = useState<AlertType | null>(null);
  const [typeModalVisible, setTypeModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [radiusM, setRadiusM] = useState(100);

  const selectedMeta = selectedType ? ALERT_TYPE_META[selectedType] : null;
  const hasPosition = lat !== null && lon !== null;

  async function handleConfirm() {
    if (!selectedType || lat === null || lon === null) return;
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      await createAlert({
        type: selectedType,
        lat,
        lon,
        locationLabel: await reverseGeocode(lat, lon),
        comment: description || null,
        radiusM,
      });
      router.replace('/(tabs)/carte');
    } catch (err: unknown) {
      const axErr = err as { response?: { status?: number; data?: { detail?: string } } };
      const status = axErr?.response?.status;
      const detail = axErr?.response?.data?.detail;
      if (status === 401) {
        setSubmitError('Session expirée. Reconnectez-vous.');
      } else if (status === 403) {
        setSubmitError(detail ?? 'Compte non vérifié ou suspendu.');
      } else if (status === 422) {
        setSubmitError(`Données invalides (422): ${detail ?? JSON.stringify(axErr?.response?.data)}`);
      } else {
        setSubmitError(`Erreur ${status ?? 'réseau'} — ${detail ?? 'impossible de créer le signalement'}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header retour */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/carte'))} style={styles.back} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={COLORS.noir} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Signaler une alerte</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* 1) Type d'incident */}
        <View style={styles.section}>
          <Text style={styles.fieldLabel}>Type d&apos;incident *</Text>
          <TouchableOpacity
            style={[styles.fieldButton, selectedMeta && styles.fieldButtonActive]}
            onPress={() => setTypeModalVisible(true)}
            activeOpacity={0.7}
          >
            {selectedMeta ? (
              <View style={styles.fieldRow}>
                <View style={[styles.emojiTile, { backgroundColor: selectedMeta.color }]}>
                  <Text style={styles.emojiText}>{selectedMeta.emoji}</Text>
                </View>
                <Text style={styles.fieldValue}>{selectedMeta.label}</Text>
              </View>
            ) : (
              <Text style={styles.fieldPlaceholder}>Choisir un type</Text>
            )}
            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* 2) Modal sélecteur — bottom sheet */}
        <Modal
          visible={typeModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setTypeModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setTypeModalVisible(false)}
          >
            <TouchableOpacity activeOpacity={1} style={styles.sheet}>
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>Type d&apos;incident</Text>
              <FlatList
                data={ALERT_TYPES}
                keyExtractor={(item) => item.value}
                scrollEnabled={false}
                ItemSeparatorComponent={() => <View style={styles.sheetSeparator} />}
                renderItem={({ item }) => {
                  const meta = ALERT_TYPE_META[item.value];
                  return (
                    <TouchableOpacity
                      style={[styles.sheetOption, selectedType === item.value && styles.fieldButtonActive]}
                      onPress={() => {
                        setSelectedType(item.value);
                        setTypeModalVisible(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.emojiTileLg, { backgroundColor: meta.color }]}>
                        <Text style={styles.emojiText}>{meta.emoji}</Text>
                      </View>
                      <Text style={styles.fieldValue}>{meta.label}</Text>
                    </TouchableOpacity>
                  );
                }}
                ListFooterComponent={
                  FEATURES.LOST_LUGGAGE_ENABLED ? null : (
                    <>
                      {PREVIEW_TYPES.map((meta) => (
                        <View key={meta.label} style={[styles.sheetOption, styles.sheetOptionDisabled, styles.sheetFooterRow]}>
                          <View style={[styles.emojiTileLg, { backgroundColor: meta.color }]}>
                            <Text style={styles.emojiText}>{meta.emoji}</Text>
                          </View>
                          <Text style={styles.fieldValue}>{meta.label}</Text>
                          <View style={styles.sheetSpacer} />
                          <ComingSoonBadge label="Bientôt disponible" />
                        </View>
                      ))}
                    </>
                  )
                }
              />
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        {/* 3) Position */}
        <View style={styles.section}>
          <Text style={styles.fieldLabel}>Position</Text>
          {loading ? (
            <View style={styles.mapLoading}>
              <ActivityIndicator color={COLORS.turquoise} />
              <Text style={styles.caption}>Localisation en cours…</Text>
            </View>
          ) : hasPosition ? (
            <View style={styles.mapWrap}>
              <MapView
                style={styles.map}
                region={{ latitude: lat, longitude: lon, latitudeDelta: 0.005, longitudeDelta: 0.005 }}
              >
                <Marker coordinate={{ latitude: lat, longitude: lon }} />
              </MapView>
              <View style={styles.mapBadge}>
                <Ionicons name="location" size={14} color={COLORS.turquoiseDark} />
                <Text style={styles.mapBadgeText} numberOfLines={1}>
                  {lat.toFixed(5)}, {lon.toFixed(5)}
                  {isApproximate ? ' (approx.)' : ''}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.gpsError}>
              <Ionicons name="warning" size={18} color={COLORS.agression} />
              <Text style={styles.gpsErrorText}>{locationError ?? 'GPS indisponible'}</Text>
              <Button label="Réessayer" variant="tertiary" size="sm" onPress={() => router.replace('/signalement')} />
            </View>
          )}
        </View>

        {/* 4) Description */}
        <View style={styles.section}>
          <Text style={styles.fieldLabel}>
            Description <Text style={styles.optional}>(facultatif)</Text>
          </Text>
          <TextInput
            style={styles.descriptionInput}
            multiline
            placeholder="Décris brièvement la situation…"
            placeholderTextColor={COLORS.textSecondary}
            maxLength={300}
            value={description}
            onChangeText={setDescription}
            textAlignVertical="top"
          />
          <Text style={styles.counter}>{description.length} / 300</Text>
        </View>

        {/* 5) Média */}
        <View style={styles.section}>
          <View style={styles.mediaRow}>
            <Button
              label=""
              variant="tertiary"
              onPress={() => RNAlert.alert('Photo', 'Upload photo disponible en V1.5')}
              style={styles.mediaButton}
              icon={
                <View style={styles.mediaInner}>
                  <Ionicons name="camera-outline" size={22} color={COLORS.noir} />
                  <View style={styles.mediaLabelRow}>
                    <Text style={styles.mediaLabel}>Photo</Text>
                    <View style={[styles.flagBadge, styles.flagV15]}>
                      <Text style={[styles.flagText, styles.flagV15Text]}>V1.5</Text>
                    </View>
                  </View>
                </View>
              }
            />
            <Button
              label=""
              variant="tertiary"
              onPress={() => RNAlert.alert('Vocal', 'Enregistrement vocal disponible en V2')}
              style={styles.mediaButton}
              icon={
                <View style={styles.mediaInner}>
                  <Ionicons name="mic-outline" size={22} color={COLORS.noir} />
                  <View style={styles.mediaLabelRow}>
                    <Text style={styles.mediaLabel}>Vocal</Text>
                    <View style={[styles.flagBadge, styles.flagV2]}>
                      <Text style={[styles.flagText, styles.flagV2Text]}>V2</Text>
                    </View>
                  </View>
                </View>
              }
            />
          </View>
        </View>

        {/* 6) Rayon de diffusion */}
        <View style={styles.section}>
          <View style={styles.radiusHeader}>
            <Text style={styles.fieldLabel}>Rayon de diffusion</Text>
            <Text style={styles.radiusValue}>{radiusM} m</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={50}
            maximumValue={500}
            step={25}
            value={radiusM}
            onValueChange={(v) => setRadiusM(Math.round(v))}
            minimumTrackTintColor={COLORS.turquoise}
            maximumTrackTintColor={COLORS.border}
            thumbTintColor={COLORS.turquoise}
          />
          <View style={styles.radiusScale}>
            <Text style={styles.caption}>50 m</Text>
            <Text style={styles.caption}>500 m</Text>
          </View>
        </View>

        {/* 7) Erreur d'envoi */}
        {submitError && (
          <View style={styles.submitError}>
            <Ionicons name="warning" size={18} color={COLORS.agression} />
            <Text style={styles.submitErrorText}>{submitError}</Text>
          </View>
        )}

        {/* 8) CTA */}
        <Button
          label="Confirmer le signalement"
          uppercase
          variant="primary"
          onPress={handleConfirm}
          loading={isSubmitting}
          disabled={!selectedType || !hasPosition || isSubmitting}
          style={styles.cta}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.fond },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.screen,
    paddingBottom: SPACING.md,
    gap: SPACING.md,
  },
  back: { padding: SPACING.xs },
  headerTitle: { fontFamily: FONT.semibold, fontSize: 18, color: COLORS.noir },
  container: { padding: SPACING.screen, paddingBottom: SPACING.xl, gap: 18 },
  section: { gap: SPACING.sm },
  fieldLabel: { fontFamily: FONT.medium, fontSize: 14, color: COLORS.grisTexte },
  optional: { ...TEXT.body, fontFamily: FONT.regular, fontSize: 14, color: COLORS.textSecondary },

  // Field button (type)
  fieldButton: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.input,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.base,
  },
  fieldButtonActive: { borderColor: COLORS.turquoise },
  fieldRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, flex: 1 },
  fieldValue: { fontFamily: FONT.semibold, fontSize: 16, color: COLORS.noir },
  fieldPlaceholder: { fontFamily: FONT.regular, fontSize: 16, color: COLORS.textSecondary },
  emojiTile: { width: 32, height: 32, borderRadius: RADIUS.badge, alignItems: 'center', justifyContent: 'center' },
  emojiTileLg: { width: 34, height: 34, borderRadius: RADIUS.badge, alignItems: 'center', justifyContent: 'center' },
  emojiText: { fontSize: 18 },

  // Modal sheet
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.sheet,
    borderTopRightRadius: RADIUS.sheet,
    padding: SPACING.screen,
    gap: SPACING.md,
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.handle, alignSelf: 'center' },
  sheetTitle: { fontFamily: FONT.semibold, fontSize: 18, color: COLORS.noir },
  sheetOption: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.input,
    paddingHorizontal: SPACING.base,
  },
  sheetOptionDisabled: { opacity: 0.5 },
  sheetFooterRow: { marginTop: SPACING.sm },
  sheetSpacer: { flex: 1 },
  sheetSeparator: { height: SPACING.sm },

  // Position
  mapWrap: { height: 140, borderRadius: RADIUS.card, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
  map: { ...StyleSheet.absoluteFillObject },
  mapBadge: {
    position: 'absolute',
    left: SPACING.sm,
    bottom: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.badge,
    paddingVertical: 5,
    paddingHorizontal: 9,
    maxWidth: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  mapBadgeText: { fontFamily: FONT.medium, fontSize: 12, color: COLORS.noir },
  mapLoading: {
    height: 140,
    borderRadius: RADIUS.card,
    backgroundColor: COLORS.fond,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  gpsError: {
    borderRadius: RADIUS.card,
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#F5C6C6',
    padding: SPACING.base,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  gpsErrorText: { fontFamily: FONT.medium, fontSize: 14, color: COLORS.agression, textAlign: 'center' },

  // Description
  descriptionInput: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.input,
    backgroundColor: COLORS.surface,
    minHeight: 120,
    paddingVertical: 14,
    paddingHorizontal: SPACING.base,
    fontFamily: FONT.regular,
    fontSize: 16,
    color: COLORS.noir,
  },
  counter: { fontFamily: FONT.regular, fontSize: 12, color: COLORS.textSecondary, textAlign: 'right' },

  // Média
  mediaRow: { flexDirection: 'row', gap: SPACING.md },
  mediaButton: { flex: 1, height: 'auto', paddingVertical: 14, paddingHorizontal: SPACING.md },
  mediaInner: { flexDirection: 'column', alignItems: 'center', gap: 6 },
  mediaLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  mediaLabel: { fontFamily: FONT.semibold, fontSize: 16, color: COLORS.noir },
  flagBadge: { borderRadius: RADIUS.badge, paddingVertical: 2, paddingHorizontal: 6 },
  flagV15: { backgroundColor: '#E3F2FD' },
  flagV15Text: { color: '#1565C0' },
  flagV2: { backgroundColor: '#F3E5F5' },
  flagV2Text: { color: '#7B1FA2' },
  flagText: { fontFamily: FONT.semibold, fontSize: 11 },

  // Rayon
  radiusHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  radiusValue: { fontFamily: FONT.semibold, fontSize: 14, color: COLORS.turquoiseDark },
  slider: { width: '100%', height: 40 },
  radiusScale: { flexDirection: 'row', justifyContent: 'space-between' },
  caption: { fontFamily: FONT.regular, fontSize: 12, color: COLORS.textSecondary },

  // Submit error
  submitError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: '#FFF5F5',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  submitErrorText: { flex: 1, fontFamily: FONT.medium, fontSize: 14, color: COLORS.agression },

  // CTA
  cta: { marginTop: SPACING.sm },
});
