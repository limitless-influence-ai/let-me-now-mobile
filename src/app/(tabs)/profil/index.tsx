import { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet, ScrollView, Image } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import * as ImagePicker from 'expo-image-picker';
import Slider from '@react-native-community/slider';
import { Button } from '@/components/ui/Button';
import { Toggle } from '@/components/ui/Toggle';
import { useAuthStore } from '@/store/auth.store';
import { authService } from '@/services/auth.service';
import { credibilityText } from '@/lib/credibility';
import { COLORS } from '@/constants/colors';
import { FONT, RADIUS, SPACING, TEXT } from '@/constants/theme';

export default function ProfilScreen() {
  const router = useRouter();
  const { user, logout, setUser } = useAuthStore();

  // Refresh the real score from the API each time the profile gains focus,
  // so vote-driven score changes (FEATURE_SCORE_ENABLED) show up. Best-effort:
  // a failure leaves the cached user untouched.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      authService
        .fetchMe()
        .then((fresh) => {
          if (active) setUser(fresh);
        })
        .catch(() => {});
      return () => {
        active = false;
      };
    }, [setUser]),
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Toggles préférences notifications — purement visuels [V1.5]
  const [notifAgression, setNotifAgression] = useState(true);
  const [notifHomophobe, setNotifHomophobe] = useState(true);
  const [notifPickpocket, setNotifPickpocket] = useState(false);
  const [radius, setRadius] = useState(500);

  async function handleLogout() {
    const refreshToken = await SecureStore.getItemAsync('refresh_token');
    try {
      if (refreshToken) await authService.logout(refreshToken);
    } finally {
      await SecureStore.deleteItemAsync('access_token');
      await SecureStore.deleteItemAsync('refresh_token');
      logout();
      router.replace('/');
    }
  }

  function handleDeleteAccount() {
    Alert.alert(
      'Supprimer mon compte',
      'Cette action est irréversible. Vos données personnelles seront supprimées et vos alertes anonymisées (conformité RGPD).',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await authService.deleteAccount();
              await SecureStore.deleteItemAsync('access_token');
              await SecureStore.deleteItemAsync('refresh_token');
              logout();
              router.replace('/');
            } catch {
              Alert.alert('Erreur', 'Impossible de supprimer le compte. Réessayez.');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ],
    );
  }

  async function handlePickPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', "Autorisez l'accès à la galerie pour modifier votre photo.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!result.canceled) {
      Alert.alert('Photo sélectionnée', 'Upload vers R2 disponible en V1.5');
    }
  }

  if (!user) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyCircle}>
          <Text style={styles.emptyEmoji}>👤</Text>
        </View>
        <Text style={[TEXT.h2, styles.emptyTitle]}>Pas encore de profil</Text>
        <Text style={[TEXT.body, styles.emptyBody]}>
          Connectez-vous pour gérer votre profil, vos préférences et vos signalements.
        </Text>
        <Button
          label="Se connecter / S'inscrire"
          variant="secondary"
          onPress={() => router.push('/auth/connexion')}
          style={styles.emptyButton}
        />
      </View>
    );
  }

  const avatarUrl = (user as { avatar_url?: string | null }).avatar_url ?? null;
  const initial = user.pseudo?.trim().charAt(0).toUpperCase() || '?';

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {/* En-tête profil */}
      <View style={styles.profileHeader}>
        <TouchableOpacity style={styles.avatar} onPress={handlePickPhoto} activeOpacity={0.85}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarInitial}>{initial}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={handlePickPhoto} activeOpacity={0.7}>
          <Text style={styles.editPhoto}>Modifier la photo</Text>
        </TouchableOpacity>

        <Text style={[TEXT.h2, styles.pseudo]}>{user.pseudo}</Text>
        {!!user.email && <Text style={[TEXT.caption, styles.email]}>{user.email}</Text>}

        <View style={styles.credibilityRow}>
          <View style={styles.credibilityChip}>
            <Text style={styles.credibilityText}>⭐ Crédibilité : {credibilityText(user.score)}</Text>
          </View>
          <View style={styles.versionFlag}>
            <Text style={styles.versionFlagText}>V1.5</Text>
          </View>
        </View>
      </View>

      {/* Carte Paramètres */}
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.setRow}
          onPress={() => setSettingsOpen((v) => !v)}
          activeOpacity={0.7}
        >
          <View style={styles.setRowLeft}>
            <View style={styles.setIcon}>
              <Text style={styles.setIconEmoji}>🔔</Text>
            </View>
            <Text style={styles.setTitle}>Préférences de notifications</Text>
            <View style={styles.versionFlag}>
              <Text style={styles.versionFlagText}>V1.5</Text>
            </View>
          </View>
          <Ionicons
            name={settingsOpen ? 'chevron-down' : 'chevron-forward'}
            size={18}
            color={COLORS.textSecondary}
          />
        </TouchableOpacity>

        {settingsOpen && (
          <View style={styles.settingsBody}>
            <View style={styles.toggleRow}>
              <View style={[styles.dot, { backgroundColor: COLORS.agression }]} />
              <Text style={styles.toggleLabel}>Agression</Text>
              <Toggle value={notifAgression} onValueChange={setNotifAgression} />
            </View>

            <View style={styles.toggleRow}>
              <View style={[styles.dot, { backgroundColor: COLORS.homophobe }]} />
              <Text style={styles.toggleLabel}>Agression homophobe</Text>
              <Toggle value={notifHomophobe} onValueChange={setNotifHomophobe} />
            </View>

            <View style={styles.toggleRow}>
              <View style={[styles.dot, { backgroundColor: COLORS.pickpocket }]} />
              <Text style={styles.toggleLabel}>Pickpocket</Text>
              <Toggle value={notifPickpocket} onValueChange={setNotifPickpocket} />
            </View>

            <View style={styles.divider} />

            <View style={styles.radiusRow}>
              <Text style={styles.toggleLabel}>Rayon de notification</Text>
              <Text style={styles.radiusValue}>{Math.round(radius)} m</Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={300}
              maximumValue={1000}
              step={50}
              value={radius}
              onValueChange={setRadius}
              minimumTrackTintColor={COLORS.turquoise}
              maximumTrackTintColor={COLORS.border}
              thumbTintColor={COLORS.turquoiseDark}
            />
          </View>
        )}
      </View>

      {/* Déconnexion */}
      <Button label="Se déconnecter" variant="tertiary" onPress={handleLogout} style={styles.logoutButton} />

      {/* Zone de danger */}
      <View style={styles.dangerZone}>
        <Text style={styles.dangerTitle}>Zone de danger</Text>
        <Button
          label="Supprimer mon compte"
          variant="destructive-outline"
          onPress={handleDeleteAccount}
          disabled={isDeleting}
          loading={isDeleting}
          icon={<Ionicons name="trash-outline" size={18} color={COLORS.agression} />}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: COLORS.fond },
  content: { paddingHorizontal: SPACING.screen, paddingBottom: SPACING.xl },

  // ── En-tête profil ──
  profileHeader: { alignItems: 'center', paddingTop: SPACING.lg },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.turquoise,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: { width: 88, height: 88, borderRadius: 44 },
  avatarInitial: { fontFamily: FONT.bold, fontSize: 34, color: '#FFFFFF' },
  editPhoto: { fontFamily: FONT.semibold, fontSize: 14, color: COLORS.turquoiseDark, marginTop: SPACING.md },
  pseudo: { marginTop: SPACING.sm, textAlign: 'center' },
  email: { marginTop: SPACING.xs, textAlign: 'center' },
  credibilityRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: SPACING.md },
  credibilityChip: {
    backgroundColor: 'rgba(67,160,71,0.1)',
    borderRadius: RADIUS.badge,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  credibilityText: { fontFamily: FONT.semibold, fontSize: 13, color: COLORS.cactus },

  // ── Flag de version réutilisable ──
  versionFlag: { backgroundColor: '#E3F2FD', borderRadius: 5, paddingHorizontal: 7, paddingVertical: 2 },
  versionFlagText: { fontFamily: FONT.bold, fontSize: 10, color: '#1565C0' },

  // ── Carte Paramètres ──
  card: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.card,
    paddingHorizontal: SPACING.base,
    marginTop: SPACING.xl,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.base,
  },
  setRowLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, flexShrink: 1 },
  setIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.fond,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setIconEmoji: { fontSize: 18 },
  setTitle: { fontFamily: FONT.semibold, fontSize: 15, color: COLORS.noir },

  settingsBody: { paddingBottom: SPACING.base },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingVertical: SPACING.sm },
  dot: { width: 10, height: 10, borderRadius: 5 },
  toggleLabel: { flex: 1, fontFamily: FONT.medium, fontSize: 15, color: COLORS.grisTexte },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.md },
  radiusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  radiusValue: { fontFamily: FONT.semibold, fontSize: 15, color: COLORS.turquoiseDark },
  slider: { width: '100%', height: 36 },

  // ── Déconnexion ──
  logoutButton: { marginTop: SPACING.lg },

  // ── Zone de danger ──
  dangerZone: { marginTop: SPACING.xl },
  dangerTitle: {
    fontFamily: FONT.semibold,
    fontSize: 12,
    color: COLORS.agression,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.md,
  },

  // ── Guard non-connecté ──
  emptyContainer: {
    flex: 1,
    backgroundColor: COLORS.fond,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.screen,
  },
  emptyCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(79,195,199,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyEmoji: { fontSize: 44 },
  emptyTitle: { marginTop: SPACING.lg, textAlign: 'center' },
  emptyBody: { marginTop: SPACING.sm, textAlign: 'center' },
  emptyButton: { marginTop: SPACING.lg },
});
