import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/colors';
import { SHADOW } from '@/constants/theme';

interface Props {
  onPress: () => void;
  /** [V1.5 #8] Grise le FAB quand l'utilisateur est banni. Le tap reste actif
   *  pour expliquer pourquoi (message géré par l'appelant). */
  disabled?: boolean;
}

/** FAB « signaler » — cercle turquoise 56px, icône +, ombre douce turquoise. */
export function FAB({ onPress, disabled = false }: Props) {
  return (
    <TouchableOpacity
      style={[styles.fab, disabled && styles.fabDisabled]}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityState={{ disabled }}
    >
      <Ionicons name="add" size={28} color="#fff" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 96,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.turquoise,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW.fab,
  },
  // Banni : turquoise atténué + opacité réduite — visuellement « éteint ».
  fabDisabled: {
    backgroundColor: COLORS.textSecondary,
    opacity: 0.5,
  },
});
