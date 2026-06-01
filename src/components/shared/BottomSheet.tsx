import { Modal, View, Pressable, StyleSheet } from 'react-native';
import { COLORS } from '@/constants/colors';
import { RADIUS, SPACING, SHADOW } from '@/constants/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

/** Bottom sheet « Refined Street » — radius 24 en haut, poignée, scrim sombre. */
export function BottomSheet({ visible, onClose, children }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        {children}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(26,26,26,0.45)' },
  sheet: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.screen,
    paddingTop: 10,
    paddingBottom: SPACING.xl,
    borderTopLeftRadius: RADIUS.sheet,
    borderTopRightRadius: RADIUS.sheet,
    ...SHADOW.sheet,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.handle,
    alignSelf: 'center',
    marginBottom: 18,
  },
});
