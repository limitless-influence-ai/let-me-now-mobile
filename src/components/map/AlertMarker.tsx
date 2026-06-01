import { View, Text, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import { Alert } from '@/types/alert.types';
import { ALERT_TYPE_META } from '@/constants/theme';

export const MARKER_COLORS: Record<Alert['type'], string> = {
  AGRESSION: ALERT_TYPE_META.AGRESSION.color,
  AGRESSION_HOMOPHOBE: ALERT_TYPE_META.AGRESSION_HOMOPHOBE.color,
  PICKPOCKET: ALERT_TYPE_META.PICKPOCKET.color,
  CACTUS: ALERT_TYPE_META.CACTUS.color,
};

interface Props {
  alert: Alert;
  onPress: (alert: Alert) => void;
}

/** Marqueur pin « Refined Street » — goutte 32×40 colorée, bordure blanche, emoji du type. */
export function AlertMarker({ alert, onPress }: Props) {
  const meta = ALERT_TYPE_META[alert.type];
  return (
    <Marker
      coordinate={{ latitude: alert.lat, longitude: alert.lon }}
      onPress={() => onPress(alert)}
      anchor={{ x: 0.5, y: 1 }}
      tracksViewChanges={false}
    >
      <View style={styles.pin}>
        <View style={[styles.head, { backgroundColor: meta.color }]} />
        <Text style={styles.glyph}>{meta.emoji}</Text>
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  pin: { width: 34, height: 42, alignItems: 'center' },
  head: {
    width: 32,
    height: 32,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    borderBottomLeftRadius: 0,
    borderWidth: 2,
    borderColor: '#fff',
    transform: [{ rotate: '-45deg' }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 4,
    elevation: 4,
  },
  glyph: { position: 'absolute', top: 5, width: 32, textAlign: 'center', fontSize: 15 },
});
