import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '@/constants/colors';
import { FONT, RADIUS } from '@/constants/theme';

interface Props {
  /** Texte affiché. Par défaut « Bientôt » ; passer « Bientôt disponible » là où la place le permet. */
  label?: string;
}

/**
 * Pastille « Bientôt » réutilisable — signale une feature en preview (onglet
 * Live, type « Bagage oublié », et Cactus si réactivé en preview). Fond gris
 * clair, coins arrondis, texte gris foncé.
 */
export function ComingSoonBadge({ label = 'Bientôt' }: Props) {
  return (
    <View style={styles.badge}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: COLORS.border, // #E5E5E7
    borderRadius: RADIUS.badge, // 8px
    paddingVertical: 3,
    paddingHorizontal: 8,
    alignSelf: 'flex-start',
  },
  text: { fontFamily: FONT.semibold, fontSize: 12, color: COLORS.grisTexte }, // Inter 600 / #4A4A4A
});
