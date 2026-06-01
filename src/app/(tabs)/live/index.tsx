import { View, Text, StyleSheet } from 'react-native';
import { ComingSoonBadge } from '@/components/ui/ComingSoonBadge';
import { COLORS } from '@/constants/colors';
import { SPACING, TEXT } from '@/constants/theme';

// Onglet « Live » (artistes dans les transports) — placeholder tant que la
// feature n'est pas construite. L'onglet est intercepté dans `(tabs)/_layout`
// et n'atteint normalement pas cet écran ; il sert de filet « Bientôt ».
export default function LiveScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.illo}>
        <Text style={styles.emoji}>📡</Text>
      </View>
      <Text style={[TEXT.h2, styles.title]}>Live arrive bientôt</Text>
      <Text style={[TEXT.body, styles.body]}>
        Bientôt, suis en direct l'activité de la communauté autour de toi : alertes en temps réel, fil live et plus
        encore.
      </Text>
      <ComingSoonBadge label="Bientôt disponible" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.fond,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    gap: 14,
  },
  illo: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(245,181,200,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 42 },
  title: { textAlign: 'center' },
  body: { textAlign: 'center' },
});
