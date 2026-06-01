import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardTypeOptions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/colors';
import { FONT, RADIUS, SPACING } from '@/constants/theme';

interface Props {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  /** Message d'erreur — bordure rouge + affichage sous le champ. */
  error?: string;
  /** Aide discrète sous le champ (masquée s'il y a une erreur). */
  hint?: string;
}

/** Champ « Refined Street » — 56px, bordure turquoise au focus / rouge en erreur. */
export function Input({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoCapitalize = 'none',
  error,
  hint,
}: Props) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(!!secureTextEntry);

  return (
    <View style={styles.field}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.wrap}>
        <TextInput
          style={[
            styles.input,
            focused && styles.focus,
            !!error && styles.error,
            !!secureTextEntry && styles.inputWithIcon,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textSecondary}
          secureTextEntry={hidden}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {secureTextEntry && (
          <Pressable style={styles.eye} onPress={() => setHidden((h) => !h)} hitSlop={8}>
            <Ionicons name={hidden ? 'eye-outline' : 'eye-off-outline'} size={22} color={COLORS.textSecondary} />
          </Pressable>
        )}
      </View>
      {error ? (
        <View style={styles.errRow}>
          <Ionicons name="alert-circle-outline" size={14} color={COLORS.agression} />
          <Text style={styles.errText}>{error}</Text>
        </View>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { marginBottom: SPACING.base },
  label: { fontFamily: FONT.medium, fontSize: 14, color: COLORS.grisTexte, marginBottom: SPACING.sm },
  wrap: { position: 'relative', justifyContent: 'center' },
  input: {
    height: 56,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.input,
    paddingHorizontal: 16,
    fontFamily: FONT.regular,
    fontSize: 16,
    color: COLORS.noir,
    backgroundColor: COLORS.surface,
  },
  inputWithIcon: { paddingRight: 48 },
  focus: { borderColor: COLORS.turquoise },
  error: { borderColor: COLORS.agression },
  eye: { position: 'absolute', right: 16 },
  errRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 7 },
  errText: { fontFamily: FONT.regular, fontSize: 12, color: COLORS.agression },
  hint: { fontFamily: FONT.regular, fontSize: 12, color: COLORS.textSecondary, marginTop: 7 },
});
