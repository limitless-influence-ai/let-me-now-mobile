import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/colors';
import { SHADOW } from '@/constants/theme';

interface Props {
  onPress: () => void;
}

/** FAB « signaler » — cercle turquoise 56px, icône +, ombre douce turquoise. */
export function FAB({ onPress }: Props) {
  return (
    <TouchableOpacity style={styles.fab} onPress={onPress} activeOpacity={0.85}>
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
});
