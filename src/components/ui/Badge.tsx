import { View, Text, StyleSheet } from 'react-native';
import { AlertType } from '@/types/alert.types';
import { FONT, RADIUS, ALERT_TYPE_META } from '@/constants/theme';

interface Props {
  type: AlertType;
  size?: 'md' | 'lg';
}

/** Badge type d'alerte — emoji + libellé sur fond de couleur du type. */
export function Badge({ type, size = 'md' }: Props) {
  const meta = ALERT_TYPE_META[type];
  return (
    <View style={[styles.badge, size === 'lg' && styles.badgeLg, { backgroundColor: meta.color }]}>
      <Text style={[styles.label, size === 'lg' && styles.labelLg]}>
        {meta.emoji} {meta.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    height: 28,
    paddingHorizontal: 10,
    borderRadius: RADIUS.badge,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeLg: { height: 34, paddingHorizontal: 14 },
  label: { fontFamily: FONT.semibold, fontSize: 13, color: '#fff' },
  labelLg: { fontSize: 15 },
});
