import { View, Text, ScrollView, RefreshControl, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { HeroProximity } from '@/components/home/HeroProximity';
import { QuickActions } from '@/components/home/QuickActions';
import { AlertCard } from '@/components/alerts/AlertCard';
import { useHome } from '@/hooks/useHome';
import { useAlerts } from '@/hooks/useAlerts';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useAuthStore } from '@/store/auth.store';
import { NearbyAlert } from '@/lib/homeAlerts';
import { Alert } from '@/types/alert.types';
import { COLORS } from '@/constants/colors';
import { FONT, RADIUS, SPACING, TEXT, SHADOW, ALERT_TYPE_META } from '@/constants/theme';
import { CONFIG } from '@/constants/config';

const ZONE_RADIUS_LABEL = `Rayon ${CONFIG.DEFAULT_RADIUS_M} m`;

export default function AccueilScreen() {
  const router = useRouter();
  const { connected, status, refreshing, refresh, nearby, hotzones, lat, lon } = useHome();
  const { setSelectedAlert } = useAlerts();
  const user = useAuthStore((s) => s.user);

  // Temps réel pour le connecté : le WS alimente le store partagé → la liste se
  // met à jour en direct (la pastille « En direct » reflète cet état).
  useWebSocket(connected ? lat : null, connected ? lon : null, CONFIG.DEFAULT_RADIUS_M);

  function openReport() {
    router.push(connected ? '/signalement' : '/auth/connexion');
  }
  function openMap() {
    router.push('/(tabs)/carte');
  }
  function openAlert(alert: Alert) {
    setSelectedAlert(alert);
    router.push('/(tabs)/carte');
  }

  if (status === 'error') {
    return (
      <View style={styles.center}>
        <View style={[styles.errIll]}>
          <Ionicons name="wifi-outline" size={40} color={COLORS.corail} />
        </View>
        <Text style={[TEXT.h2, styles.errTitle]}>Connexion perdue</Text>
        <Text style={[TEXT.body, styles.errBody]}>
          Impossible de récupérer les alertes autour de toi. Vérifie ta connexion et réessaie.
        </Text>
        <TouchableOpacity style={styles.retryBtn} onPress={refresh} activeOpacity={0.85}>
          <Text style={styles.retryTxt}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (status === 'loading') {
    return <HomeSkeleton />;
  }

  const count = nearby.length;
  const zoneLabel = count === 0 ? `Aucune alerte signalée — ${ZONE_RADIUS_LABEL.toLowerCase()}` : ZONE_RADIUS_LABEL;
  const previewAlerts = nearby.slice(0, 3);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      refreshControl={
        // Pull-to-refresh : surtout pour le visiteur (instantané REST), mais
        // disponible aussi au connecté pour forcer une resynchro.
        <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={COLORS.turquoise} />
      }
    >
      {/* 1 · Hero proximité */}
      <HeroProximity
        connected={connected}
        refreshing={refreshing}
        count={count}
        zoneLabel={zoneLabel}
        updatedLabel="Mis à jour à l'instant"
      />

      {/* 2 · Actions rapides */}
      <QuickActions connected={connected} onReport={openReport} onOpenMap={openMap} />

      {/* 3 · Mini-carte cliquable */}
      <TouchableOpacity style={styles.mapWrap} onPress={openMap} activeOpacity={0.9}>
        {lat !== null && lon !== null && (
          <MapView
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
            region={{ latitude: lat, longitude: lon, latitudeDelta: 0.012, longitudeDelta: 0.012 }}
            scrollEnabled={false}
            zoomEnabled={false}
            rotateEnabled={false}
            pitchEnabled={false}
          >
            {previewAlerts.map((a) => (
              <Marker key={a.id} coordinate={{ latitude: a.lat, longitude: a.lon }} pinColor={ALERT_TYPE_META[a.type].color} />
            ))}
          </MapView>
        )}
        <View style={styles.mapCta}>
          <Ionicons name="map-outline" size={15} color={COLORS.noir} />
          <Text style={styles.mapCtaTxt}>Ouvrir la carte</Text>
        </View>
      </TouchableOpacity>

      {/* 4 · Dernières alertes proches */}
      <View style={styles.sec}>
        <Text style={styles.secTitle}>{count === 0 ? 'Dernières alertes' : 'Dernières alertes proches'}</Text>
        {count > 0 && (
          <TouchableOpacity style={styles.see} onPress={openMap} activeOpacity={0.7}>
            <Text style={styles.seeTxt}>Tout voir</Text>
            <Ionicons name="chevron-forward" size={15} color={COLORS.turquoiseDark} />
          </TouchableOpacity>
        )}
      </View>

      {count === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIll}>
            <Text style={styles.emptyEmoji}>🗺️</Text>
          </View>
          <Text style={styles.emptyTxt}>Aucune alerte active autour de toi.{'\n'}Bonne nouvelle !</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {previewAlerts.map((a: NearbyAlert) => (
            <AlertCard key={a.id} alert={a} distanceM={a.distanceM} isRead={!connected} onPress={openAlert} />
          ))}
        </View>
      )}

      {/* 5 · Bloc contextuel */}
      {connected ? (
        <ConnectedContext score={user?.score} hotzones={hotzones} />
      ) : (
        <InviteCard onSignup={() => router.push('/auth/inscription')} onLogin={() => router.push('/auth/connexion')} />
      )}
    </ScrollView>
  );
}

/* ── 5a · Bloc connecté : stats perso + zones chaudes ── */
function ConnectedContext({ score, hotzones }: { score?: number; hotzones: ReturnType<typeof useHome>['hotzones'] }) {
  const credibility = score === undefined ? '—' : score >= 100 ? 'Élevée' : score >= 50 ? 'Correcte' : 'Faible';
  return (
    <>
      <View style={styles.sec}><Text style={styles.secTitle}>Ton activité</Text></View>
      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={[styles.statVal, { color: COLORS.cactus }]}>{credibility}</Text>
          <Text style={styles.statLabel}>Crédibilité</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statVal}>{score ?? '—'}</Text>
          <Text style={styles.statLabel}>Score</Text>
        </View>
      </View>

      {hotzones.length > 0 && (
        <>
          <View style={styles.sec}><Text style={styles.secTitle}>Zones chaudes</Text></View>
          <View style={styles.hot}>
            {hotzones.slice(0, 3).map((z, i) => (
              <View key={z.geohash ?? i} style={[styles.hotRow, i > 0 && styles.hotRowBorder]}>
                <View style={styles.hotL}>
                  <View style={[styles.hotDot, { backgroundColor: COLORS.agression }]} />
                  <Text style={styles.hotName} numberOfLines={1}>Zone à {z.lat.toFixed(3)}, {z.lon.toFixed(3)}</Text>
                </View>
                <Text style={styles.hotCount}>{z.count} alertes</Text>
              </View>
            ))}
          </View>
        </>
      )}
    </>
  );
}

/* ── 5b · Carte d'incitation (visiteur) ── */
function InviteCard({ onSignup, onLogin }: { onSignup: () => void; onLogin: () => void }) {
  const feats = ['Alertes en temps réel', 'Filtres par type de danger', 'Voter pour fiabiliser les alertes'];
  return (
    <View style={styles.invite}>
      <Text style={styles.inviteTitle}>Passe en temps réel</Text>
      <Text style={styles.inviteP}>Le suivi live est réservé aux comptes. Crée le tien pour débloquer :</Text>
      <View style={styles.inviteFeats}>
        {feats.map((f) => (
          <View key={f} style={styles.inviteFeat}>
            <View style={styles.inviteCk}><Ionicons name="checkmark" size={14} color={COLORS.turquoise} /></View>
            <Text style={styles.inviteFeatTxt}>{f}</Text>
          </View>
        ))}
      </View>
      <TouchableOpacity style={styles.inviteBtn} onPress={onSignup} activeOpacity={0.85}>
        <Text style={styles.inviteBtnTxt}>Créer un compte</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onLogin} activeOpacity={0.7}>
        <Text style={styles.inviteLogin}>Déjà inscrit ? <Text style={styles.inviteLink}>Se connecter</Text></Text>
      </TouchableOpacity>
    </View>
  );
}

/* ── Squelette de chargement ── */
function HomeSkeleton() {
  return (
    <View style={styles.content}>
      <View style={[styles.skel, { height: 128, borderRadius: RADIUS.card }]} />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={[styles.skel, { flex: 1, height: 104, borderRadius: RADIUS.btn }]} />
        <View style={[styles.skel, { flex: 1, height: 104, borderRadius: RADIUS.btn }]} />
      </View>
      <View style={[styles.skel, { height: 150, borderRadius: RADIUS.card }]} />
      <View style={[styles.skel, { height: 18, width: 150, borderRadius: 6 }]} />
      {[0, 1, 2].map((i) => <View key={i} style={[styles.skel, { height: 78, borderRadius: RADIUS.card }]} />)}
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: COLORS.fond },
  content: { padding: SPACING.screen, gap: 16 },

  // Mini-carte
  mapWrap: { height: 150, borderRadius: RADIUS.card, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.border },
  mapCta: { position: 'absolute', right: 12, bottom: 12, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.surface, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12, ...SHADOW.soft },
  mapCtaTxt: { fontFamily: FONT.semibold, fontSize: 13, color: COLORS.noir },

  // Section label
  sec: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  secTitle: { fontFamily: FONT.bold, fontSize: 16, color: COLORS.noir },
  see: { flexDirection: 'row', alignItems: 'center', gap: 1 },
  seeTxt: { fontFamily: FONT.semibold, fontSize: 13, color: COLORS.turquoiseDark },
  list: { gap: 12 },

  // Empty
  empty: { alignItems: 'center', gap: 12, padding: 20, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.card },
  emptyIll: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(67,160,71,0.1)', alignItems: 'center', justifyContent: 'center' },
  emptyEmoji: { fontSize: 28 },
  emptyTxt: { fontFamily: FONT.regular, fontSize: 14, color: COLORS.grisTexte, textAlign: 'center', lineHeight: 20 },

  // Stats
  stats: { flexDirection: 'row', gap: 12 },
  stat: { flex: 1, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.card, padding: 16 },
  statVal: { fontFamily: FONT.bold, fontSize: 24, color: COLORS.noir },
  statLabel: { fontFamily: FONT.medium, fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },

  // Zones chaudes
  hot: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.card, overflow: 'hidden' },
  hotRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 13, paddingHorizontal: 16 },
  hotRowBorder: { borderTopWidth: 1, borderTopColor: COLORS.border },
  hotL: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 },
  hotDot: { width: 10, height: 10, borderRadius: 5 },
  hotName: { fontFamily: FONT.semibold, fontSize: 14, color: COLORS.noir, flexShrink: 1 },
  hotCount: { fontFamily: FONT.bold, fontSize: 13, color: COLORS.grisTexte, backgroundColor: COLORS.fond, borderRadius: RADIUS.pill, paddingVertical: 4, paddingHorizontal: 11, overflow: 'hidden' },

  // Invite (visiteur)
  invite: { backgroundColor: COLORS.noir, borderRadius: RADIUS.card, padding: 22 },
  inviteTitle: { fontFamily: FONT.bold, fontSize: 19, color: '#FFFFFF', marginBottom: 6 },
  inviteP: { fontFamily: FONT.regular, fontSize: 13.5, color: '#C8C8CC', lineHeight: 20, marginBottom: 16 },
  inviteFeats: { gap: 10, marginBottom: 18 },
  inviteFeat: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  inviteCk: { width: 22, height: 22, borderRadius: 6, backgroundColor: 'rgba(79,195,199,0.22)', alignItems: 'center', justifyContent: 'center' },
  inviteFeatTxt: { fontFamily: FONT.medium, fontSize: 14, color: '#FFFFFF' },
  inviteBtn: { height: 50, borderRadius: RADIUS.btn, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  inviteBtnTxt: { fontFamily: FONT.semibold, fontSize: 16, color: COLORS.noir },
  inviteLogin: { fontFamily: FONT.regular, fontSize: 13, color: '#C8C8CC', textAlign: 'center', marginTop: 12 },
  inviteLink: { fontFamily: FONT.semibold, color: COLORS.turquoise },

  // Erreur réseau
  center: { flex: 1, backgroundColor: COLORS.fond, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 14 },
  errIll: { width: 96, height: 96, borderRadius: 48, backgroundColor: 'rgba(255,138,101,0.12)', alignItems: 'center', justifyContent: 'center' },
  errTitle: { textAlign: 'center' },
  errBody: { textAlign: 'center' },
  retryBtn: { height: 52, paddingHorizontal: 24, borderRadius: RADIUS.btn, backgroundColor: COLORS.turquoise, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  retryTxt: { fontFamily: FONT.semibold, fontSize: 16, color: '#FFFFFF' },

  // Skeleton
  skel: { backgroundColor: COLORS.border, opacity: 0.6 },
});
