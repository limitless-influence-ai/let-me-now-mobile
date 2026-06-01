import { useState, useRef, useEffect, useCallback } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Modal, FlatList, SafeAreaView } from 'react-native';
import MapView, { Marker, Region, Circle, Callout } from 'react-native-maps';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { AlertMarker, MARKER_COLORS } from '@/components/map/AlertMarker';
import { AlertTooltip } from '@/components/map/AlertTooltip';
import { AlertCluster } from '@/components/map/AlertCluster';
import { AlertDetailSheet } from '@/components/map/AlertDetailSheet';
import { FilterSheet } from '@/components/map/FilterSheet';
import { CactusPopup } from '@/components/cactus/CactusPopup';
import { useAlerts } from '@/hooks/useAlerts';
import { useLocation } from '@/hooks/useLocation';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useAuthStore } from '@/store/auth.store';
import { useMapStore } from '@/store/map.store';
import { alertsService } from '@/services/alerts.service';
import { Alert } from '@/types/alert.types';
import { COLORS } from '@/constants/colors';
import { CONFIG, FEATURES } from '@/constants/config';
import { FONT, RADIUS, SPACING, SHADOW, ALERT_TYPE_META } from '@/constants/theme';
import { MAP_STYLE } from '@/constants/mapStyle';
import { isAlertTypeVisible } from '@/lib/featureGuards';

const REGION_DELTA = { latitudeDelta: 0.005, longitudeDelta: 0.005 };

function haversineM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6_371_000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

interface ClusterItem {
  kind: 'cluster';
  id: string;
  latitude: number;
  longitude: number;
  alerts: Alert[];
}

interface MarkerItem {
  kind: 'marker';
  alert: Alert;
}

type RenderedItem = ClusterItem | MarkerItem;

function computeRenderedItems(filteredAlerts: Alert[], latDelta: number): RenderedItem[] {
  const clusterRadiusDeg = latDelta * 0.15;
  const assigned = new Set<string>();
  const items: RenderedItem[] = [];

  for (const alert of filteredAlerts) {
    if (assigned.has(alert.id)) continue;

    const group: Alert[] = [alert];
    for (const other of filteredAlerts) {
      if (other.id === alert.id || assigned.has(other.id)) continue;
      const dist = Math.abs(other.lat - alert.lat) + Math.abs(other.lon - alert.lon);
      if (dist < clusterRadiusDeg) {
        group.push(other);
      }
    }

    if (group.length >= 3) {
      for (const a of group) assigned.add(a.id);
      const centLat = group.reduce((s, a) => s + a.lat, 0) / group.length;
      const centLon = group.reduce((s, a) => s + a.lon, 0) / group.length;
      items.push({
        kind: 'cluster',
        id: `cluster-${alert.id}`,
        latitude: centLat,
        longitude: centLon,
        alerts: group,
      });
    } else {
      assigned.add(alert.id);
      items.push({ kind: 'marker', alert });
    }
  }

  return items;
}

export default function CarteScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const isAuthenticated = !!user;
  const { alerts, selectedAlert, fetchAlerts, setSelectedAlert } = useAlerts();
  const { lat, lon, isApproximate } = useLocation();
  const [filterVisible, setFilterVisible] = useState(false);
  const [cactusVisible, setCactusVisible] = useState(false);
  const [voteError, setVoteError] = useState<string | null>(null);
  const [tooltipAlert, setTooltipAlert] = useState<Alert | null>(null);
  const [activeFilters, setActiveFilters] = useState({ agression: true, homophobe: true, pickpocket: true, cactus: true });
  const [currentLatDelta, setCurrentLatDelta] = useState(0.005);
  const [currentRadiusM, setCurrentRadiusM] = useState<number>(CONFIG.DEFAULT_RADIUS_M);
  const [clusterAlerts, setClusterAlerts] = useState<Alert[] | null>(null);

  const mapRef = useRef<MapView>(null);
  // Always holds the latest known position for use in callbacks
  const locationRef = useRef<{ lat: number; lon: number } | null>(null);
  const hasAutocentered = useRef(false);
  const hasLoadedAlerts = useRef(false);
  const cactusLastDismissed = useRef<number | null>(null);
  // Ref for filtered alerts — avoids stale closure in onRegionChangeComplete
  const filteredAlertsRef = useRef<Alert[]>([]);
  // Track whether selectedAlert was auto-opened (N3) to avoid closing manual selections
  const autoOpenedAlertIdRef = useRef<string | null>(null);

  const locateTrigger = useMapStore((s) => s.locateTrigger);
  const targetAlert = useMapStore((s) => s.targetAlert);
  const setTargetAlert = useMapStore((s) => s.setTargetAlert);
  const ghostAlert = useMapStore((s) => s.ghostAlert);
  const setGhostAlert = useMapStore((s) => s.setGhostAlert);
  const setCameraCenter = useMapStore((s) => s.setCameraCenter);

  // Realtime alerts stream — WS re-fetches on (re)connect using the same radius
  // as the REST fetch below, so reconnects don't overwrite the store with a
  // narrower/wider set than the user's current filter.
  useWebSocket(lat, lon, currentRadiusM);

  // Keep locationRef in sync with the latest GPS position
  useEffect(() => {
    if (lat !== null && lon !== null) {
      locationRef.current = { lat, lon };
    }
  }, [lat, lon]);

  // Load alerts once when first GPS position is available
  useEffect(() => {
    if (lat !== null && lon !== null && !hasLoadedAlerts.current) {
      hasLoadedAlerts.current = true;
      fetchAlerts(lat, lon, CONFIG.DEFAULT_RADIUS_M);
    }
  }, [lat, lon]);

  // Auto-center once when the first valid position is available (app open)
  useEffect(() => {
    if (lat !== null && lon !== null && !hasAutocentered.current && mapRef.current) {
      hasAutocentered.current = true;
      mapRef.current.animateToRegion({ latitude: lat, longitude: lon, ...REGION_DELTA }, 400);
    }
  }, [lat, lon]);

  // Re-center when the locate button is tapped
  useEffect(() => {
    if (locateTrigger === 0) return;
    const pos = locationRef.current;
    if (pos && mapRef.current) {
      mapRef.current.animateToRegion({ latitude: pos.lat, longitude: pos.lon, ...REGION_DELTA }, 500);
    }
  }, [locateTrigger]);

  // UX-01 / UX-04 — Teleport to alert tapped from the alerts list
  useEffect(() => {
    if (!targetAlert) return;
    mapRef.current?.animateToRegion({
      latitude: targetAlert.lat,
      longitude: targetAlert.lon,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    }, 600);
    if (targetAlert.status === 'active') {
      // Normal behaviour: open the tooltip
      setTooltipAlert(targetAlert);
    } else {
      // Inactive alert: place a ghost marker, no tooltip
      setGhostAlert(targetAlert);
      setTooltipAlert(null);
    }
    setTargetAlert(null);
  }, [targetAlert]);

  // Cactus auto-popup: show when authenticated user is within 200m of an active CACTUS alert
  useEffect(() => {
    if (!FEATURES.CACTUS_ENABLED) return;
    if (!isAuthenticated || lat === null || lon === null || cactusVisible) return;
    const cooldownOk =
      cactusLastDismissed.current === null ||
      Date.now() - cactusLastDismissed.current >= CONFIG.CACTUS_POPUP_INTERVAL_MS;
    if (!cooldownOk) return;
    const nearCactus = alerts
      .filter((a) => a.type === 'CACTUS' && a.status === 'active')
      .some((a) => haversineM(lat, lon, a.lat, a.lon) <= CONFIG.CACTUS_RADIUS_M);
    if (nearCactus) {
      setCactusVisible(true);
    }
  }, [lat, lon, alerts]);

  // Re-center when coming back to this screen (e.g. after submitting an alert)
  useFocusEffect(
    useCallback(() => {
      const pos = locationRef.current;
      if (pos && mapRef.current) {
        mapRef.current.animateToRegion({ latitude: pos.lat, longitude: pos.lon, ...REGION_DELTA }, 500);
      }
    }, []),
  );

  function handleMarkerPress(alert: Alert) {
    autoOpenedAlertIdRef.current = null;
    setTooltipAlert(alert);
    setVoteError(null);
  }

  async function handleVote(alertId: string, type: 'CONFIRM' | 'INVALIDATE') {
    setVoteError(null);
    try {
      await alertsService.vote(alertId, type);
      setSelectedAlert(null);
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      if (detail === 'Cannot vote on your own alert') {
        setVoteError('Vous ne pouvez pas voter sur votre propre alerte');
      } else {
        setVoteError(detail ?? 'Erreur lors du vote');
      }
    }
  }

  function handleRegionChangeComplete(region: Region) {
    setCurrentLatDelta(region.latitudeDelta);
    setCameraCenter({ lat: region.latitude, lon: region.longitude });
    if (ghostAlert) setGhostAlert(null);

    const filtered = filteredAlertsRef.current;
    if (region.latitudeDelta < 0.008) {
      const visible = filtered.filter(
        (a) =>
          Math.abs(a.lat - region.latitude) < region.latitudeDelta / 2 &&
          Math.abs(a.lon - region.longitude) < region.longitudeDelta / 2,
      );
      if (visible.length === 1 && !selectedAlert) {
        // Only update state if it's a different alert — prevents re-render flicker
        if (autoOpenedAlertIdRef.current !== visible[0].id) {
          autoOpenedAlertIdRef.current = visible[0].id;
          setTooltipAlert(visible[0]);
        }
      } else if (visible.length !== 1 && autoOpenedAlertIdRef.current !== null) {
        // Panned away or multiple markers visible — close auto tooltip
        autoOpenedAlertIdRef.current = null;
        setTooltipAlert(null);
      }
    } else {
      // Dezoom — close any auto-opened tooltip
      if (autoOpenedAlertIdRef.current !== null) {
        autoOpenedAlertIdRef.current = null;
        setTooltipAlert(null);
      }
    }
  }

  const initialRegion = {
    latitude: lat ?? 48.8566,
    longitude: lon ?? 2.3522,
    ...REGION_DELTA,
  };

  // Compute filtered alerts
  const filteredAlerts = alerts.filter((a) => {
    if (a.status !== 'active') return false;
    if (!isAlertTypeVisible(a.type, FEATURES.CACTUS_ENABLED)) return false;
    if (a.type === 'CACTUS' && !isAuthenticated) return false;
    if (a.type === 'AGRESSION' && !activeFilters.agression) return false;
    if (a.type === 'AGRESSION_HOMOPHOBE' && !activeFilters.homophobe) return false;
    if (a.type === 'PICKPOCKET' && !activeFilters.pickpocket) return false;
    if (a.type === 'CACTUS' && !activeFilters.cactus) return false;
    return true;
  });

  // Keep the ref in sync so onRegionChangeComplete can access latest filtered alerts
  filteredAlertsRef.current = filteredAlerts;

  const renderedItems = computeRenderedItems(filteredAlerts, currentLatDelta);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        customMapStyle={MAP_STYLE}
        showsUserLocation={false}
        onRegionChangeComplete={handleRegionChangeComplete}
        onPress={() => setTooltipAlert(null)}
      >
        {filteredAlerts.map((alert) => (
          <Circle
            key={`circle-${alert.id}`}
            center={{ latitude: alert.lat, longitude: alert.lon }}
            radius={alert.radiusM ?? 500}
            fillColor={MARKER_COLORS[alert.type] + '18'}
            strokeColor={MARKER_COLORS[alert.type] + '66'}
            strokeWidth={1}
          />
        ))}

        {renderedItems.map((item) => {
          if (item.kind === 'cluster') {
            return (
              <AlertCluster
                key={item.id}
                coordinate={{ latitude: item.latitude, longitude: item.longitude }}
                count={item.alerts.length}
                onPress={() => setClusterAlerts(item.alerts)}
              />
            );
          }
          return <AlertMarker key={item.alert.id} alert={item.alert} onPress={handleMarkerPress} />;
        })}

        {tooltipAlert && (
          <AlertTooltip
            alert={tooltipAlert}
            onOpenDetail={(a) => { setTooltipAlert(null); setSelectedAlert(a); setVoteError(null); }}
            onDismiss={() => setTooltipAlert(null)}
          />
        )}

        {ghostAlert && (
          <Marker
            coordinate={{ latitude: ghostAlert.lat, longitude: ghostAlert.lon }}
            opacity={0.4}
            tracksViewChanges={false}
          >
            <View style={styles.ghostDot} />
            <Callout>
              <View style={styles.ghostCallout}>
                <Text style={styles.ghostCalloutTitle}>Cette alerte était ici</Text>
                <Text style={styles.ghostCalloutMeta}>
                  {ghostAlert.type.replace('_', ' ')} · {new Date(ghostAlert.createdAt).toLocaleString('fr-FR')}
                </Text>
              </View>
            </Callout>
          </Marker>
        )}

        {lat !== null && lon !== null && !isApproximate && (
          <Marker coordinate={{ latitude: lat, longitude: lon }} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
            <View style={styles.userDot}>
              <View style={styles.userDotCore} />
            </View>
          </Marker>
        )}
      </MapView>

      {isAuthenticated && (
        <TouchableOpacity style={styles.filtersBtn} onPress={() => setFilterVisible(true)} activeOpacity={0.85}>
          <Ionicons name="filter" size={18} color={COLORS.grisTexte} />
          <Text style={styles.filtersBtnLabel}>Filtres</Text>
        </TouchableOpacity>
      )}

      {!isAuthenticated && (
        <View style={styles.inviteCard}>
          <Text style={styles.inviteTitle}>Rejoins la communauté</Text>
          <Text style={styles.inviteText}>Connecte-toi pour signaler, filtrer et voter sur les alertes.</Text>
          <Button
            label="Se connecter / S'inscrire"
            variant="secondary"
            size="sm"
            onPress={() => router.push('/auth/connexion')}
          />
        </View>
      )}

      <AlertDetailSheet
        alert={selectedAlert}
        isAuthenticated={isAuthenticated}
        voteError={voteError}
        onClose={() => { setSelectedAlert(null); setVoteError(null); autoOpenedAlertIdRef.current = null; }}
        onConfirm={(id) => handleVote(id, 'CONFIRM')}
        onInvalidate={(id) => handleVote(id, 'INVALIDATE')}
      />

      <FilterSheet
        visible={filterVisible}
        isAuthenticated={isAuthenticated}
        onClose={() => setFilterVisible(false)}
        onApply={(filters) => {
          setActiveFilters({ agression: filters.agression, homophobe: filters.homophobe, pickpocket: filters.pickpocket, cactus: filters.cactus });
          // Keep the WS backfill radius in sync with the REST fetch radius.
          setCurrentRadiusM(filters.radiusM);
          if (lat !== null && lon !== null) {
            fetchAlerts(lat, lon, filters.radiusM);
          }
        }}
      />

      <CactusPopup
        visible={cactusVisible}
        onDismiss={() => {
          cactusLastDismissed.current = Date.now();
          setCactusVisible(false);
        }}
      />

      {/* N2 — Cluster list modal */}
      <Modal visible={!!clusterAlerts} transparent animationType="slide" onRequestClose={() => setClusterAlerts(null)}>
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Alertes groupées ({clusterAlerts?.length ?? 0})</Text>
            <FlatList
              data={clusterAlerts ?? []}
              keyExtractor={(a) => a.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.clusterItem}
                  onPress={() => {
                    setClusterAlerts(null);
                    handleMarkerPress(item);
                  }}
                >
                  <Text style={styles.clusterItemType}>{ALERT_TYPE_META[item.type].emoji} {ALERT_TYPE_META[item.type].label}</Text>
                  <Text style={styles.clusterItemLabel}>{item.locationLabel}</Text>
                  <Text style={styles.clusterItemTime}>
                    {new Date(item.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
            <TouchableOpacity style={styles.closeButton} onPress={() => setClusterAlerts(null)}>
              <Text style={styles.closeButtonText}>FERMER</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  filtersBtn: {
    position: 'absolute',
    top: 14,
    left: SPACING.screen,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 44,
    paddingHorizontal: 16,
    borderRadius: RADIUS.btn,
    backgroundColor: COLORS.surface,
    ...SHADOW.soft,
  },
  filtersBtnLabel: { fontFamily: FONT.semibold, fontSize: 14, color: COLORS.noir },
  inviteCard: {
    position: 'absolute',
    bottom: 16,
    left: SPACING.screen,
    right: SPACING.screen,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    ...SHADOW.soft,
  },
  inviteTitle: { fontFamily: FONT.semibold, fontSize: 18, color: COLORS.noir, marginBottom: 4 },
  inviteText: { fontFamily: FONT.regular, fontSize: 12, color: COLORS.textSecondary, marginBottom: 14 },
  userDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(66, 133, 244, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userDotCore: {
    width: 13,
    height: 13,
    borderRadius: 6.5,
    backgroundColor: '#4285F4',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  // Ghost marker (UX-04)
  ghostDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#757575',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  ghostCallout: {
    padding: 8,
    maxWidth: 200,
  },
  ghostCalloutTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 4,
  },
  ghostCalloutMeta: {
    fontSize: 12,
    color: '#757575',
  },
  // Cluster modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  modalSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.sheet,
    borderTopRightRadius: RADIUS.sheet,
    paddingTop: 16,
    maxHeight: '60%',
  },
  modalTitle: {
    fontFamily: FONT.semibold,
    fontSize: 18,
    color: COLORS.noir,
    paddingHorizontal: SPACING.screen,
    marginBottom: 8,
  },
  clusterItem: {
    paddingVertical: 12,
    paddingHorizontal: SPACING.screen,
  },
  clusterItemType: {
    fontFamily: FONT.semibold,
    fontSize: 15,
    color: COLORS.noir,
  },
  clusterItemLabel: {
    fontFamily: FONT.regular,
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  clusterItemTime: {
    fontFamily: FONT.regular,
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.screen,
  },
  closeButton: {
    margin: SPACING.base,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.btn,
    paddingVertical: 14,
    alignItems: 'center',
  },
  closeButtonText: {
    fontFamily: FONT.semibold,
    fontSize: 14,
    color: COLORS.noir,
  },
});
