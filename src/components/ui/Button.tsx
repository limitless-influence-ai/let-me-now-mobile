import { ReactNode } from 'react';
import { Pressable, Text, ActivityIndicator, StyleSheet, ViewStyle, View } from 'react-native';
import { COLORS } from '@/constants/colors';
import { FONT, RADIUS } from '@/constants/theme';

type Variant = 'primary' | 'secondary' | 'tertiary' | 'destructive' | 'destructive-outline';

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  uppercase?: boolean;
  size?: 'md' | 'sm';
  icon?: ReactNode;
  style?: ViewStyle;
}

/** Bouton « Refined Street » — 56px (ou 44px en `sm`), radius 12, scale au press. */
export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  uppercase,
  size = 'md',
  icon,
  style,
}: Props) {
  const isDisabled = disabled || loading;
  const spinnerColor = variant === 'tertiary' || variant === 'destructive-outline' ? COLORS.noir : '#fff';

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        size === 'sm' && styles.sm,
        VARIANT_STYLES[variant],
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={spinnerColor} />
      ) : (
        <View style={styles.row}>
          {icon}
          <Text
            style={[
              styles.label,
              size === 'sm' && styles.labelSm,
              { color: VARIANT_TEXT[variant] },
              uppercase && styles.upper,
            ]}
          >
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const VARIANT_STYLES: Record<Variant, ViewStyle> = {
  primary: { backgroundColor: COLORS.noir },
  secondary: { backgroundColor: COLORS.turquoise },
  tertiary: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: COLORS.border },
  destructive: { backgroundColor: COLORS.agression },
  'destructive-outline': { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: COLORS.agression },
};

const VARIANT_TEXT: Record<Variant, string> = {
  primary: '#fff',
  secondary: '#fff',
  tertiary: COLORS.noir,
  destructive: '#fff',
  'destructive-outline': COLORS.agression,
};

const styles = StyleSheet.create({
  base: {
    height: 56,
    paddingHorizontal: 24,
    borderRadius: RADIUS.btn,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  sm: { height: 44, paddingHorizontal: 16 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  disabled: { opacity: 0.5 },
  pressed: { transform: [{ scale: 0.98 }] },
  label: { fontFamily: FONT.semibold, fontSize: 16 },
  labelSm: { fontSize: 14 },
  upper: { textTransform: 'uppercase', letterSpacing: 0.6 },
});
