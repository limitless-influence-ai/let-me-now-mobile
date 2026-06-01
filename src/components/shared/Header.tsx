import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/colors';
import { FONT } from '@/constants/theme';
import { Logo } from './Logo';

interface Props {
  showNotification?: boolean;
  onNotificationPress?: () => void;
  notificationCount?: number;
}

/** Header app « Refined Street » — logo à gauche, cloche à droite, fond blanc. */
export function Header({ showNotification, onNotificationPress, notificationCount = 0 }: Props) {
  return (
    <View style={styles.header}>
      <Logo height={40} />
      {showNotification ? (
        <TouchableOpacity onPress={onNotificationPress} hitSlop={8}>
          <View>
            <Ionicons name="notifications-outline" size={24} color={COLORS.noir} />
            {notificationCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{notificationCount > 9 ? '9+' : notificationCount}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      ) : (
        <View style={styles.bellSpacer} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 56,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  bellSpacer: { width: 24 },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    backgroundColor: COLORS.agression,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  badgeText: { color: '#fff', fontSize: 10, fontFamily: FONT.bold },
});
