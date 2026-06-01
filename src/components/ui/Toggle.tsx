import { Pressable, View, StyleSheet } from 'react-native';
import { COLORS } from '@/constants/colors';

interface Props {
  value: boolean;
  onValueChange: (next: boolean) => void;
  disabled?: boolean;
}

/** Toggle custom « Refined Street » — piste 48×28, pastille blanche, ON = turquoise. */
export function Toggle({ value, onValueChange, disabled }: Props) {
  return (
    <Pressable
      onPress={() => !disabled && onValueChange(!value)}
      disabled={disabled}
      style={[styles.track, value && styles.trackOn, disabled && styles.disabled]}
    >
      <View style={[styles.knob, value && styles.knobOn]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
  },
  trackOn: { backgroundColor: COLORS.turquoise },
  disabled: { opacity: 0.45 },
  knob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fff',
    marginLeft: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
  },
  knobOn: { marginLeft: 23 },
});
