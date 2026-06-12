import { Platform, TextStyle, ViewStyle } from 'react-native';
import { COLORS } from './colors';
import { AlertType } from '@/types/alert.types';

/** Grille d'espacement 8px (« Refined Street »). */
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  screen: 20, // marge horizontale d'écran
} as const;

/** Rayons de coins. */
export const RADIUS = {
  card: 16,
  sheet: 24,
  btn: 12,
  input: 12,
  badge: 8,
  pill: 999,
} as const;

/**
 * Familles de police Inter (chargées dans le layout racine via
 * `@expo-google-fonts/inter`). Utiliser `fontFamily` — et NON `fontWeight` —
 * pour obtenir la bonne graisse Inter.
 */
export const FONT = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

/** Échelle typographique prête à l'emploi. */
export const TEXT: Record<string, TextStyle> = {
  h1: { fontFamily: FONT.bold, fontSize: 24, lineHeight: 29, color: COLORS.noir, letterSpacing: -0.2 },
  h2: { fontFamily: FONT.bold, fontSize: 20, lineHeight: 24, color: COLORS.noir },
  title: { fontFamily: FONT.semibold, fontSize: 18, lineHeight: 22, color: COLORS.noir },
  body: { fontFamily: FONT.regular, fontSize: 16, lineHeight: 24, color: COLORS.grisTexte },
  bodyBold: { fontFamily: FONT.semibold, fontSize: 16, lineHeight: 24, color: COLORS.noir },
  label: { fontFamily: FONT.medium, fontSize: 14, lineHeight: 20, color: COLORS.grisTexte },
  caption: { fontFamily: FONT.regular, fontSize: 12, lineHeight: 16, color: COLORS.textSecondary },
};

/** Ombres douces (le design évite les ombres dures). */
export const SHADOW: Record<string, ViewStyle> = {
  fab: Platform.select({
    ios: { shadowColor: COLORS.turquoise, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12 },
    android: { elevation: 6 },
    default: {},
  }) as ViewStyle,
  soft: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
    android: { elevation: 3 },
    default: {},
  }) as ViewStyle,
  sheet: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -8 }, shadowOpacity: 0.12, shadowRadius: 30 },
    android: { elevation: 12 },
    default: {},
  }) as ViewStyle,
};

/** Métadonnées par type d'alerte : couleur + emoji + libellé (cohérent partout). */
export const ALERT_TYPE_META: Record<AlertType, { color: string; emoji: string; label: string }> = {
  AGRESSION: { color: COLORS.agression, emoji: '🚨', label: 'Agression' },
  AGRESSION_HOMOPHOBE: { color: COLORS.homophobe, emoji: '🏳️‍🌈', label: 'Agression homophobe' },
  PICKPOCKET: { color: COLORS.pickpocket, emoji: '🎒', label: 'Pickpocket' },
  CACTUS: { color: COLORS.cactus, emoji: '🌵', label: 'Cactus' },
};

/**
 * Types d'alerte en *preview* — affichés dans l'UI derrière une pastille
 * « Bientôt » mais pas encore signalables (gérés par leur feature flag dans
 * `FEATURES`). Quand un type est promu, le déplacer dans `ALERT_TYPE_META`
 * et étendre l'union `AlertType` + l'enum backend.
 */
export const PREVIEW_ALERT_TYPE_META = {
  LOST_LUGGAGE: { color: COLORS.lostLuggage, emoji: '🧳', label: 'Bagage oublié' },
  ABDUCTION: { color: COLORS.abduction, emoji: '🆘', label: 'Alerte enlèvement' },
  // Libellé volontairement descriptif d'un COMPORTEMENT observable — jamais une
  // étiquette nominative sur une personne (cf. CLAUDE.md, contrainte sensible).
  CHILD_SAFETY: { color: COLORS.childSafety, emoji: '🛡️', label: 'Comportement suspect envers mineurs' },
} as const;

/** Ajoute un alpha hex (00–FF) à une couleur #RRGGBB. */
export function withAlpha(hex: string, alpha: string): string {
  return `${hex}${alpha}`;
}
