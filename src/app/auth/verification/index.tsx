import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { COLORS } from '@/constants/colors';
import { RADIUS, SPACING, TEXT } from '@/constants/theme';
import api from '@/services/api';

export default function VerificationScreen() {
  const router = useRouter();
  const [sent, setSent] = useState(false);

  async function handleResend() {
    try {
      await api.post('/api/v1/auth/resend-verification');
      setSent(true);
      Alert.alert('Email envoyé', 'Vérifiez votre boîte mail');
    } catch {
      Alert.alert('Erreur', 'Impossible de renvoyer l\'email');
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.back} onPress={() => (router.canGoBack() ? router.back() : router.replace('/auth/connexion'))} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={COLORS.noir} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vérification</Text>
        <View style={styles.back} />
      </View>

      <View style={styles.container}>
        <View style={styles.circle}>
          <Ionicons name="mail-outline" size={44} color={COLORS.turquoiseDark} />
        </View>

        <Text style={styles.h1}>Vérifie ta boîte mail</Text>
        <Text style={styles.body}>
          Un lien de confirmation a été envoyé à ton adresse email. Clique dessus pour activer ton compte.
        </Text>

        {sent && (
          <View style={styles.badge}>
            <Ionicons name="checkmark-circle" size={16} color={COLORS.cactus} />
            <Text style={styles.badgeText}>Email renvoyé</Text>
          </View>
        )}

        <View style={styles.actions}>
          <Button
            label={sent ? 'Renvoyé ✓' : "Renvoyer l'email"}
            variant="secondary"
            onPress={handleResend}
            disabled={sent}
          />
          <Text style={styles.note}>L&apos;écran reste en lecture seule jusqu&apos;à la confirmation.</Text>
        </View>

        <TouchableOpacity style={styles.link} onPress={() => router.replace('/auth/connexion')}>
          <Text style={styles.linkText}>← Retour à la connexion</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.fond },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.screen,
    paddingVertical: SPACING.md,
  },
  back: { width: 32, alignItems: 'flex-start', justifyContent: 'center' },
  headerTitle: { ...TEXT.title },
  container: {
    flex: 1,
    paddingHorizontal: SPACING.screen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(79,195,199,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  h1: { ...TEXT.h1, textAlign: 'center', marginBottom: SPACING.md },
  body: { ...TEXT.body, textAlign: 'center', marginBottom: SPACING.lg },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: 'rgba(67,160,71,0.12)',
    borderRadius: RADIUS.badge,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  badgeText: { ...TEXT.caption, color: COLORS.cactus },
  actions: { width: '100%', alignItems: 'center' },
  note: { ...TEXT.caption, color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACING.md },
  link: { marginTop: SPACING.xl },
  linkText: { ...TEXT.caption, color: COLORS.textSecondary },
});
