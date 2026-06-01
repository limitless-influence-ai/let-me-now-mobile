import { useEffect, useState } from 'react';
import { FlatList, View, Text, StyleSheet, TouchableOpacity, Alert as RNAlert } from 'react-native';
import { useRouter } from 'expo-router';
import MapView from 'react-native-maps';
import { AlertCard } from '@/components/alerts/AlertCard';
import { AlertMarker } from '@/components/map/AlertMarker';
import { Button } from '@/components/ui/Button';
import { useAlerts } from '@/hooks/useAlerts';
import { useLocation } from '@/hooks/useLocation';
import { useAuthStore } from '@/store/auth.store';
import { useMapStore } from '@/store/map.store';
import { Alert } from '@/types/alert.types';
import { COLORS } from '@/constants/colors';
import { CONFIG, FEATURES } from '@/constants/config';
import { FONT, RADIUS, SPACING, TEXT } from '@/constants/theme';
import { isAlertTypeVisible } from '@/lib/featureGuards';

function haversineM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6_371_000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

const TABS = ['Autour de moi', 'Mes alertes'] as const;

interface EmptyStateProps {
  emoji: string;
  title: string;
  body: string;
}

function EmptyState({ emoji, title, body }: EmptyStateProps) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyCircle}>
        <Text style={styles.emptyEmoji}>{emoji}</Text>
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
    </View>
  );
}

export default function AlertesScreen() {
  const router = useRouter();
  const { alerts, myAlerts, fetchAlerts, fetchMyAlerts, deleteMyAlert } = useAlerts();
  const { lat, lon } = useLocation();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = !!user;
  const cameraCenter = useMapStore((s) => s.cameraCenter);
  const setTargetAlert = useMapStore((s) => s.setTargetAlert);
  const [activeTab, setActiveTab] = useState<0 | 1>(0);

  useEffect(() => {
    const fetchLat = cameraCenter?.lat ?? lat;
    const fetchLon = cameraCenter?.lon ?? lon;
    if (fetchLat !== null && fetchLat !== undefined && fetchLon !== null && fetchLon !== undefined) {
      fetchAlerts(fetchLat, fetchLon, CONFIG.DEFAULT_RADIUS_M);
    }
  }, [lat, lon, cameraCenter]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchMyAlerts();
    }
  }, [isAuthenticated]);

  function handlePress(alert: Alert) {
    setTargetAlert(alert);
    router.push('/(tabs)/carte');
  }

  function handleDelete(alert: Alert) {
    RNAlert.alert(
      'Supprimer le signalement',
      `Supprimer "${alert.locationLabel}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => deleteMyAlert(alert.id),
        },
      ],
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Alertes Récentes</Text>
        <View style={styles.guard}>
          <EmptyState
            emoji="🔔"
            title="Connecte-toi"
            body="Connecte-toi pour suivre les alertes autour de toi et gérer tes signalements."
          />
          <Button
            label="Se connecter / S'inscrire"
            variant="secondary"
            onPress={() => router.push('/auth/connexion')}
            style={styles.guardButton}
          />
        </View>
      </View>
    );
  }

  const mapRegion = {
    latitude: lat ?? 48.8566,
    longitude: lon ?? 2.3522,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  const visibleMarkers = alerts.filter((a) => {
    if (!isAlertTypeVisible(a.type, FEATURES.CACTUS_ENABLED)) return false;
    if (a.type === 'CACTUS' && !isAuthenticated) return false;
    return true;
  });

  const aroundAlerts = alerts.filter((a) => isAlertTypeVisible(a.type, FEATURES.CACTUS_ENABLED));
  const visibleMyAlerts = myAlerts.filter((a) => isAlertTypeVisible(a.type, FEATURES.CACTUS_ENABLED));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Alertes Récentes</Text>

      {/* Segmented control */}
      <View style={styles.segment}>
        {TABS.map((tab, index) => (
          <TouchableOpacity
            key={tab}
            style={[styles.seg, activeTab === index && styles.segActive]}
            onPress={() => setActiveTab(index as 0 | 1)}
            activeOpacity={0.85}
          >
            <Text style={[styles.segText, activeTab === index && styles.segTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Mini-carte récap */}
      <View style={styles.miniMapWrap}>
        <MapView
          style={styles.miniMap}
          region={mapRegion}
          scrollEnabled={false}
          zoomEnabled={false}
          showsUserLocation={isAuthenticated}
        >
          {visibleMarkers.map((alert) => (
            <AlertMarker key={alert.id} alert={alert} onPress={handlePress} />
          ))}
        </MapView>
      </View>

      {activeTab === 0 ? (
        <FlatList
          style={styles.list}
          contentContainerStyle={styles.listContent}
          data={aroundAlerts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <AlertCard
              alert={item}
              distanceM={lat !== null && lon !== null ? haversineM(lat, lon, item.lat, item.lon) : undefined}
              onPress={handlePress}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              emoji="🗺️"
              title="Rien à signaler"
              body="Aucune alerte active autour de toi en ce moment."
            />
          }
        />
      ) : (
        <FlatList
          style={styles.list}
          contentContainerStyle={styles.listContent}
          data={visibleMyAlerts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <AlertCard
              alert={item}
              distanceM={lat !== null && lon !== null ? haversineM(lat, lon, item.lat, item.lon) : undefined}
              onPress={handlePress}
              deletable
              onDelete={handleDelete}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              emoji="📍"
              title="Aucun signalement"
              body="Tu n'as pas encore créé d'alerte. Utilise le bouton ➕ sur la carte."
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.fond },
  title: { ...TEXT.h1, padding: SPACING.screen },

  // Segmented control
  segment: {
    flexDirection: 'row',
    marginHorizontal: SPACING.screen,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.btn,
    padding: 4,
  },
  seg: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 9,
  },
  segActive: { backgroundColor: COLORS.noir },
  segText: { fontFamily: FONT.semibold, fontSize: 14, color: COLORS.textSecondary },
  segTextActive: { color: '#fff' },

  // Mini-carte récap
  miniMapWrap: {
    marginHorizontal: SPACING.screen,
    marginTop: SPACING.base,
    height: 130,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  miniMap: { flex: 1, width: '100%' },

  // List
  list: { flex: 1, marginTop: SPACING.base },
  listContent: { paddingHorizontal: SPACING.screen, paddingBottom: SPACING.lg, gap: SPACING.md },

  // Empty state
  empty: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.lg, paddingTop: SPACING.xxl, gap: SPACING.md },
  emptyCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(79,195,199,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyEmoji: { fontSize: 42 },
  emptyTitle: { ...TEXT.h2, textAlign: 'center' },
  emptyBody: { ...TEXT.body, color: COLORS.textSecondary, textAlign: 'center' },

  // Guard
  guard: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.screen, gap: SPACING.lg },
  guardButton: { width: '100%' },
});
