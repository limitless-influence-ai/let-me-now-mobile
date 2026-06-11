import { useState } from 'react';
import { Text, TouchableOpacity, StyleSheet, ScrollView, View, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, type Href } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Logo } from '@/components/shared/Logo';
import { useAuthStore } from '@/store/auth.store';
import { authService } from '@/services/auth.service';
import { DEMO_MODE, DEMO_CREDENTIALS } from '@/demo/mock';
import { COLORS } from '@/constants/colors';
import { FONT, SPACING, TEXT } from '@/constants/theme';

export default function ConnexionScreen() {
  const router = useRouter();
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();
  const { setUser, setTokens } = useAuthStore();
  const [email, setEmail] = useState(DEMO_MODE ? DEMO_CREDENTIALS.email : '');
  const [password, setPassword] = useState(DEMO_MODE ? DEMO_CREDENTIALS.password : '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    setError(null);
    if (!email || !password) {
      setError('Email et mot de passe requis');
      return;
    }
    setIsLoading(true);
    try {
      const { user, tokens } = await authService.login(email, password);
      await SecureStore.setItemAsync('access_token', tokens.accessToken);
      await SecureStore.setItemAsync('refresh_token', tokens.refreshToken);
      setUser(user);
      setTokens(tokens);
      router.replace(((Array.isArray(redirect) ? redirect[0] : redirect) ?? '/(tabs)/carte') as Href);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number; data?: { detail?: string } } })?.response?.status;
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      if (status === 401) {
        setError('Email ou mot de passe incorrect');
      } else if (status === 403) {
        setError('Votre compte est suspendu');
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
        <TouchableOpacity style={styles.back} onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/carte'))} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={COLORS.noir} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Connexion</Text>
        <View style={styles.back} />
      </View>

      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.brand}>
          <Logo height={64} />
          <Text style={styles.subtitle}>Connecte-toi pour signaler et voter.</Text>
        </View>

        {DEMO_MODE && (
          <View style={styles.demoBanner}>
            <Text style={styles.demoBannerTitle}>🎬 Mode démo</Text>
            <Text style={styles.demoBannerText}>
              Compte de démonstration pré-rempli — appuie sur « Se connecter ».
            </Text>
            <Text style={styles.demoBannerCreds}>
              {DEMO_CREDENTIALS.email} · {DEMO_CREDENTIALS.password}
            </Text>
          </View>
        )}

        <Input
          label="Adresse email"
          value={email}
          onChangeText={setEmail}
          placeholder="votre@email.com"
          keyboardType="email-address"
        />
        <Input
          label="Mot de passe"
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secureTextEntry
          error={error ?? undefined}
        />

        <Button
          label="Se connecter"
          variant="secondary"
          onPress={handleLogin}
          loading={isLoading}
          disabled={isLoading}
        />

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>ou</Text>
          <View style={styles.dividerLine} />
        </View>

        {Platform.OS === 'android' && (
          <Button
            label="Continuer avec Google"
            variant="tertiary"
            onPress={() => Alert.alert('Bientôt disponible', 'Connexion Google sera disponible dans une prochaine version.')}
          />
        )}
        {Platform.OS === 'ios' && (
          <Button
            label="Continuer avec Apple"
            variant="tertiary"
            onPress={() => Alert.alert('Bientôt disponible', 'Connexion Apple sera disponible dans une prochaine version.')}
          />
        )}

        <TouchableOpacity style={styles.link} onPress={() => router.push('/auth/inscription')}>
          <Text style={styles.linkText}>
            Pas de compte ? <Text style={styles.linkAccent}>S&apos;inscrire</Text>
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.backLink} onPress={() => router.replace('/(tabs)/carte')}>
          <Text style={styles.backLinkText}>← Continuer sans compte</Text>
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
  brand: { alignItems: 'center', marginTop: SPACING.lg, marginBottom: SPACING.xl },
  subtitle: { ...TEXT.body, textAlign: 'center', marginTop: SPACING.base },
  demoBanner: {
    backgroundColor: 'rgba(79,195,199,0.1)',
    borderWidth: 1,
    borderColor: COLORS.turquoise,
    borderRadius: 12,
    padding: SPACING.base,
    marginBottom: SPACING.lg,
    gap: 4,
  },
  demoBannerTitle: { fontFamily: FONT.semibold, fontSize: 14, color: COLORS.turquoiseDark },
  demoBannerText: { fontFamily: FONT.regular, fontSize: 12, color: COLORS.grisTexte },
  demoBannerCreds: { fontFamily: FONT.semibold, fontSize: 12, color: COLORS.noir, marginTop: 2 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: SPACING.lg, gap: SPACING.md },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { ...TEXT.caption, color: COLORS.textSecondary },
  link: { alignItems: 'center', marginTop: SPACING.lg },
  linkText: { ...TEXT.caption, color: COLORS.grisTexte },
  linkAccent: { fontFamily: FONT.semibold, color: COLORS.turquoiseDark },
  backLink: { alignItems: 'center', marginTop: SPACING.base },
  backLinkText: { ...TEXT.caption, color: COLORS.textSecondary },
});
