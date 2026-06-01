import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Marker } from 'react-native-maps';
import { COLORS } from '@/constants/colors';
import { FONT } from '@/constants/theme';

interface Props {
  coordinate: { latitude: number; longitude: number };
  count: number;
  onPress: () => void;
}

/** Cluster « Refined Street » — cercle turquoise, bordure blanche, compteur. */
export function AlertCluster({ coordinate, count, onPress }: Props) {
  return (
    <Marker coordinate={coordinate} tracksViewChanges={false} onPress={onPress} anchor={{ x: 0.5, y: 0.5 }}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
        <View style={styles.cluster}>
          <Text style={styles.count}>{count}</Text>
        </View>
      </TouchableOpacity>
    </Marker>
  );
}

const styles = StyleSheet.create({
  cluster: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.turquoise,
    borderWidth: 2.5,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  count: { color: '#fff', fontFamily: FONT.bold, fontSize: 17 },
});
