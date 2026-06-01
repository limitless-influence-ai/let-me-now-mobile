import { useState } from 'react';
import { Text, TouchableOpacity, StyleSheet, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { authService } from '@/services/auth.service';
import { COLORS } from '@/constants/colors';
import { FONT, RADIUS, SPACING, TEXT } from '@/constants/theme';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function InscriptionScreen() {
  const router = useRouter();
  const [pseudo, setPseudo] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pseudoError, setPseudoError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleRegister() {
    setError(null);
    setPseudoError(null);
    setEmailError(null);
    setPasswordError(null);
    if (!pseudo || !email || !password) {
      if (!pseudo) setPseudoError('Le pseudo est obligatoire');
      if (!email) setEmailError('L\'email est obligatoire');
      if (!password) setPasswordError('Le mot de passe est obligatoire');
      return;
    }
    if (!EMAIL_REGEX.test(email)) {
      setEmailError('Adresse email invalide');
      return;
    }
    if (password.length < 8) {
      setPasswordError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    setIsLoading(true);
    try {
      await authService.register(email, pseudo, password);
      router.replace('/auth/verification');
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number; data?: { detail?: string } } })?.response?.status;
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      if (status === 409) {
        setEmailError('Cette adresse email est déjà utilisée');
      } else if (status === 422) {
        setError('Données invalides. Vérifiez vos informations.');
      } else if (status === 0 || !status) {
        setError('Impossible de joindre le serveur. Vérifiez votre connexion.');
      } else {
        setError(detail ?? 'Une erreur est survenue. Réessayez.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.back} onPress={() => (router.canGoBack() ? router.back() : router.replace('/auth/connexion'))} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={COLORS.noir} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Inscription</Text>
        <View style={styles.back} />
      </View>

      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.h1}>Crée ton compte</Text>
        <Text style={styles.intro}>Quelques infos suffisent pour commencer.</Text>

        <Input
          label="Pseudo *"
          value={pseudo}
          onChangeText={setPseudo}
          placeholder="ton pseudo public"
          error={pseudoError ?? undefined}
        />
        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="votre@email.com"
          keyboardType="email-address"
          error={emailError ?? undefined}
        />
        <Input
          label="Mot de passe"
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secureTextEntry
          hint="8 caractères minimum."
          error={passwordError ?? undefined}
        />

        {error && (
          <View style={styles.errBox}>
            <Ionicons name="alert-circle-outline" size={16} color={COLORS.agression} />
            <Text style={styles.errBoxText}>{error}</Text>
          </View>
        )}

        <View style={styles.info}>
          <Text style={styles.infoText}>
            Prénom, nom, date de naissance et genre seront demandés plus tard (facultatif).
          </Text>
        </View>

        <Button
          label="S'inscrire"
          variant="primary"
          uppercase
          onPress={handleRegister}
          loading={isLoading}
          disabled={isLoading}
        />

        <TouchableOpacity style={styles.link} onPress={() => router.push('/auth/connexion')}>
          <Text style={styles.linkText}>
            Déjà inscrit ? <Text style={styles.linkAccent}>Se connecter</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
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
  container: { flexGrow: 1, paddingHorizontal: SPACING.screen, paddingBottom: SPACING.xl },
  h1: { ...TEXT.h1, marginTop: SPACING.base },
  intro: { ...TEXT.body, marginTop: SPACING.sm, marginBottom: SPACING.lg },
  errBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: 'rgba(229,57,53,0.08)',
    borderRadius: RADIUS.badge,
    padding: SPACING.md,
    marginBottom: SPACING.base,
  },
  errBoxText: { ...TEXT.caption, color: COLORS.agression, flex: 1 },
  info: {
    backgroundColor: COLORS.fond,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.card,
    padding: 14,
    marginBottom: SPACING.lg,
  },
  infoText: { ...TEXT.caption, color: COLORS.textSecondary },
  link: { alignItems: 'center', marginTop: SPACING.lg },
  linkText: { ...TEXT.caption, color: COLORS.grisTexte },
  linkAccent: { fontFamily: FONT.semibold, color: COLORS.turquoiseDark },
});
