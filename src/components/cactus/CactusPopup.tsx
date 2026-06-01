import { Modal, View, Text, TouchableOpacity, Linking, StyleSheet } from 'react-native';
import { Button } from '@/components/ui/Button';
import { COLORS } from '@/constants/colors';
import { FONT, RADIUS, SPACING, ALERT_TYPE_META } from '@/constants/theme';

interface Props {
  visible: boolean;
  onDismiss: () => void;
}

/** Pop-up Cactus [FLAGGED] — modal centré, 3 redirections légales + Ignorer. */
export function CactusPopup({ visible, onDismiss }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.scrim}>
        <View style={styles.modal}>
          <View style={styles.tile}>
            <Text style={styles.tileEmoji}>{ALERT_TYPE_META.CACTUS.emoji}</Text>
          </View>
          <Text style={styles.title}>Contrôleurs signalés à proximité</Text>
          <Text style={styles.text}>Pense à voyager en règle. Voici quelques options utiles :</Text>

          <View style={styles.actions}>
            <Button
              label="🎫  Acheter un ticket"
              variant="secondary"
              size="sm"
              onPress={() => Linking.openURL('https://www.ratp.fr/titres-et-tarifs/achat-de-titre')}
            />
            <Button
              label="💳  Recharger mon Navigo"
              variant="tertiary"
              size="sm"
              onPress={() => Linking.openURL('https://www.navigo.fr')}
            />
            <Button
              label="ℹ️  Infos RATP"
              variant="tertiary"
              size="sm"
              onPress={() => Linking.openURL('https://www.ratp.fr')}
            />
            <TouchableOpacity onPress={onDismiss} style={styles.ignore}>
              <Text style={styles.ignoreText}>Ignorer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: 'rgba(26,26,26,0.45)', justifyContent: 'center', paddingHorizontal: SPACING.screen },
  modal: { backgroundColor: COLORS.surface, borderRadius: RADIUS.card, padding: 24 },
  tile: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: COLORS.cactus,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  tileEmoji: { fontSize: 28 },
  title: { fontFamily: FONT.bold, fontSize: 20, color: COLORS.noir, textAlign: 'center', marginTop: 10 },
  text: { fontFamily: FONT.regular, fontSize: 15, lineHeight: 22, color: COLORS.grisTexte, textAlign: 'center', marginTop: 8, marginBottom: 20 },
  actions: { gap: 10 },
  ignore: { alignItems: 'center', paddingVertical: 12 },
  ignoreText: { fontFamily: FONT.medium, fontSize: 14, color: COLORS.textSecondary },
});
