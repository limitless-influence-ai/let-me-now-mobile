# Changelog — lmk-mobile

Toutes les modifications notables de ce dépôt sont documentées ici.
Format inspiré de [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added — Upload photo réel : avatar + photo d'alerte `[V1.5]`
Câblage de l'UI d'upload (le backend stocke sur MinIO dev / R2 prod, derrière
`FEATURE_PHOTO_UPLOAD_ENABLED`).
- **Avatar** (écran Profil) : « Modifier la photo » réellement fonctionnel —
  sélection via `expo-image-picker`, upload multipart (`authService.uploadAvatar`),
  avatar mis à jour à l'écran, **indicateur de chargement**. Flag OFF (501) →
  alerte « Bientôt disponible » (pas de crash). Corrige au passage la lecture de
  l'avatar (`user.avatarUrl`, l'ancien cast `avatar_url` ne s'affichait jamais).
- **Photo d'alerte** (écran Signalement) : bouton Photo fonctionnel (caméra **ou**
  galerie avec demande de permission), **aperçu + retrait** avant envoi. À la
  confirmation : upload (`alertsService.uploadPhoto`) puis création de l'alerte
  avec l'URL. Feature off (404/501) → l'alerte est créée **sans** photo (message
  informatif, signalement jamais bloqué).
- **Fiche détail** : la photo de l'alerte s'affiche si présente (`alert.photoUrl`).
- Helpers purs `src/lib/photoUpload.ts` (`buildPhotoFilePart`/`buildPhotoFormData`,
  `isUploadUnavailable`, `uploadErrorMessage` — messages normalisés). `AlertCreate`
  étendu (`photoUrl`). Tests : `photoUpload.test.ts` + `photoUpload.service.test.ts`.
  tsc ✅, eslint ✅, jest **143 passed**.

### Changed — WebSocket authentifié (connectés) + fallback REST (visiteurs)
Contrepartie mobile de l'auth-only WS backend. Le temps réel est **réservé aux
utilisateurs connectés** ; le visiteur consulte la carte en REST sans live.
- `useWebSocket` n'ouvre le socket **que si authentifié** (`useAuthStore` →
  présence d'un user). Un **visiteur n'ouvre aucun socket** et **aucune erreur**
  n'est remontée (la carte charge via `GET /alerts`). La connexion est gardée sur
  la **présence d'auth** (login/logout (ré)ouvre/ferme), pas sur le token (évite de
  churner à chaque refresh).
- **JWT envoyé à l'ouverture** : `deriveWsUrl(lat, lon, token)` ajoute `&token=`
  (lu en synchrone depuis le store au moment du connect). Le backend scrubbe
  `token=` de ses logs.
- **Expiration en session** : sur un close `4401` (`WS_AUTH_FAILED_CODE`), le hook
  **rafraîchit l'access token** (`authService.refresh` + persistance SecureStore +
  store) puis reconnecte via le backoff — cohérent avec le refresh glissant.
- **Transition visiteur → connecté** : la connexion rouvre le WS proprement (dep
  `isAuthenticated`).
- `api.ts` : le refresh silencieux met aussi à jour le **store en mémoire**
  (`setTokens`) pour que le WS lise toujours le token frais.
- `carte/index.tsx` : **re-fetch au focus** de l'écran (le visiteur rafraîchit
  manuellement en revenant sur la carte ; sans effet pour le connecté, déjà live).
- Tests : token dans l'URL si connecté, pas de socket ni erreur pour le visiteur,
  transition visiteur→connecté ouvre le WS, close 4401 → refresh + reconnexion.
  Jest **131 passed**, tsc + eslint verts.

### Fixed — Réception des notifications push (chaînon manquant)
L'app enregistrait son push token mais **ne traitait aucune notification entrante** :
aucun handler, aucun listener → une notif livrée n'était jamais exploitée (pas
d'affichage premier-plan, pas de navigation au tap). De plus le token n'était
**jamais** récupéré hors build EAS (projectId absent → échec silencieux).
- `(tabs)/_layout.tsx` : `getExpoPushTokenAsync({ projectId: CONFIG.EAS_PROJECT_ID })`
  — sans `projectId` l'appel échoue en dev client / bare et **aucun token** n'est
  envoyé au backend. `EAS_PROJECT_ID` ajouté à `constants/config.ts` (miroir de
  `app.json`, valeur publique).
- `src/lib/pushNotifications.ts` (nouveau, pur) : `FOREGROUND_NOTIFICATION_BEHAVIOR`
  (banner + list + son, pas de badge OS) et `pushTapTarget(data)` (route de
  destination au tap → liste des alertes, prêt à brancher par type plus tard).
- `src/hooks/usePushNotifications.ts` (nouveau) : `setNotificationHandler` (présentation
  premier-plan) + `addNotificationReceivedListener` (point d'extension refresh) +
  `addNotificationResponseReceivedListener` (tap → `router.push` vers la liste,
  jamais de crash : erreur reportée à Sentry). Monté app-wide dans le root `_layout.tsx`.
- Tests : `pushNotifications.test.ts` (comportement premier-plan + routage du tap). 4.
  Jest **125 passed**, tsc + eslint verts.

### Changed — Hygiène
- `app.json` : config **EAS** (`extra.eas.projectId` + `owner`) désormais **versionnée**
  (elle traînait dans le working tree ; requise pour les builds EAS / APK preview).
- `src/services/api.ts` : les logs d'intercepteur (`console.log` succès + `console.warn`
  erreur) sont **conditionnés à `__DEV__`** → silencieux en build de production.

### Added — [V1.5] Zones chaudes sur la carte
Affiche les « zones chaudes » remontées par le backend (cellules où 5+ alertes ont
expiré en 24 h) sous forme de halos rouges translucides sur la carte.
- `src/types/hotzone.types.ts` + `src/services/hotzones.service.ts` (`list()` →
  `GET /alerts/hotzones`, mapping). Endpoint masqué (404) si la feature est éteinte
  → géré sans crash.
- `src/hooks/useHotzones.ts` (nouveau) : fetch au montage + re-fetch quand la liste
  d'alertes change (expirations) ; toute erreur (404/réseau) → liste vide.
- `carte/index.tsx` : `Circle` rouge translucide par zone (rayon
  `CONFIG.HOTZONE_DISPLAY_RADIUS_M` = 600 m), rendu sous les marqueurs d'alerte.
- Tests : `hotzones.service.test.ts` + `useHotzones.test.ts` (4). Jest **121 passed**,
  tsc + eslint verts.

### Added — [V1.5] Édition du pseudo avec état de cooldown (14 j)
Contrepartie mobile du cooldown backend. L'écran Profil permet de modifier le
pseudo et reflète l'éligibilité **sans tâtonner** :
- `User` porte `pseudoChangedAt` + `pseudoNextChangeAt` (mappés depuis `/users/me`) ;
  `mapUser` + `DEMO_USER` mis à jour. `authService.updatePseudo()` (PATCH /users/me).
- `src/lib/pseudoCooldown.ts` (nouveau, pur) : `canEditPseudo` (miroir de la règle
  serveur — éligible si `pseudoNextChangeAt` null ou passé), `daysUntilEditable`,
  `cooldownMessage` (« Modifiable dans X jours »), `isValidPseudo` (2–50).
- **Profil** : carte « Pseudonyme » avec champ + bouton « Modifier ». Validation
  locale 2–50 avant envoi ; bouton **grisé + délai affiché** si cooldown en cours ;
  succès → maj du pseudo ; refus `PSEUDO_CHANGE_TOO_SOON` → message avec le délai
  restant (`params.days_remaining`, format normalisé).
- Tests : `pseudoCooldown.test.ts` (éligibilité, jours restants, validation) +
  `auth.updatePseudo.test.ts` (PATCH + mapping + propagation 409). Jest **117 passed**,
  tsc + eslint verts.

### Added — [V1.5] Préférences de notification réelles (fin du faux-semblant)
Les toggles du profil étaient **décoratifs** (`useState` local, rien persisté).
Ils sont désormais câblés sur l'API (`GET` au chargement, `PATCH` à la modif).
- `src/services/preferences.service.ts` (nouveau) : `get()` / `update(partiel)`
  contre `/api/v1/users/me/preferences`, mapping snake_case ↔ camelCase ; le PATCH
  n'envoie que les champs modifiés ; mode démo renvoie des défauts.
- `src/hooks/useNotifPreferences.ts` (nouveau) : charge au montage, **mise à jour
  optimiste** avec **revert + message d'erreur** (format normalisé backend) si le
  PATCH échoue. Logique sortie du JSX (clean code).
- `profil/index.tsx` : 3 toggles (Agression / Homophobe / Pickpocket) + slider rayon
  branchés sur le hook ; rayon `PATCH` au relâcher (`onSlidingComplete`, aperçu live
  pendant le glissement) ; ligne d'erreur affichée ; toggles `disabled` en chargement.
  Suppression des `useState` non persistés.
- `NotifPreferences` ajouté à `types/user.types.ts`.
- Tests : `preferences.service.test.ts` (mapping GET + payload PATCH partiel) +
  `useNotifPreferences.test.ts` (chargement reflète le GET, modif → PATCH persisté,
  échec → revert + erreur). Jest **105 passed**, tsc + eslint verts.

### Added — [V1.5 #8] État « banni » : signalement bloqué, vote/lecture préservés
Contrepartie mobile du #8 backend (sanctions progressives). Quand l'utilisateur
est banni, l'app le reflète **proactivement** sans casser le vote ni la consultation :
- `User` porte désormais `isBanned` + `bannedUntil` (mappés depuis `/users/me`,
  déjà exposés par le backend). `mapUser` + `DEMO_USER` mis à jour.
- `src/lib/banState.ts` (nouveau, logique pure) : `isBanActive(user)` miroir de la
  garde serveur `require_not_banned` (ban actif tant que `bannedUntil` est dans le
  futur → gère l'expiration à la volée) ; `banMessage()` = raison + date de fin +
  rappel « vous pouvez toujours voter et consulter ».
- **FAB grisé** (`disabled`) quand banni ; le tap n'ouvre pas le signalement mais
  affiche une `Alert` expliquant la suspension et sa date de fin.
- `alertSubmitError.ts` lit désormais le **format d'erreur normalisé** du backend
  (`error_code` / `params` / `message`) et traite `ACCOUNT_BANNED` (message clair +
  `params.banned_until`) — repli sur le `detail` FastAPI historique conservé.
- Vote et consultation **non touchés** : aucune garde ajoutée sur ces parcours.
- Tests : `banState.test.ts` (actif/expiré/non-banni/null/date invalide, messages)
  + 2 cas `ACCOUNT_BANNED` dans `alertSubmitError.test.ts`. Jest 100 passed.

### Added — [V1.5 #5] Profil : score de crédibilité réel
Fin de l'affichage hardcodé « Crédibilité : Élevée » dans le profil — remplacé
par le vrai `user.score` retourné par l'API.

- `src/lib/credibility.ts` (nouveau) — helpers purs `credibilityLabel(score)`
  (≥ 100 « Élevée », 30–99 « Correcte », < 30 « Faible » — seuil aligné sur le
  ban #6) et `credibilityText(score)` → « Élevée · 102 ». Logique sortie du JSX.
- `src/app/(tabs)/profil/index.tsx` — la pastille affiche `credibilityText(user.score)` ;
  rafraîchissement best-effort du score via `authService.fetchMe()` + `setUser`
  à chaque focus de l'écran (les changements de score liés aux votes
  apparaissent ; un échec laisse l'utilisateur en cache intact).
- `src/lib/__tests__/credibility.test.ts` — 4 tests (libellés par seuil + texte).

### Added — [V1.5 #4] Vote : empêcher l'auto-vote + retrait temps réel
Accompagne la résolution des votes backend (seuil 10 / ratio > 70 %).
- `src/components/map/AlertDetailSheet.tsx` — nouvelle prop `isOwnAlert`. Sur sa
  propre alerte, les boutons **Confirmer/Invalider** sont masqués et remplacés
  par une note explicite (« C'est votre alerte — vous ne pouvez pas voter
  dessus »), en miroir du garde backend (403).
- `src/app/(tabs)/carte/index.tsx` — passe `isOwnAlert={selectedAlert?.userId === user.id}`.
- `src/components/map/__tests__/AlertDetailSheet.test.tsx` — 3 tests (boutons
  visibles pour un non-auteur, masqués + note sur sa propre alerte, invitation
  visiteur).
- **Déjà en place (confirmé)** : la réception de l'event WS `alert_removed`
  retire l'alerte de la carte (`useWebSocket` → `removeAlert`) ; l'erreur 403
  « Cannot vote on your own alert » est déjà gérée proprement dans `handleVote`.
### Added — [V1.5 #7] Gestion propre de l'erreur « limite d'alertes actives »
- `src/lib/alertSubmitError.ts` (nouveau) — helper pur `alertSubmitErrorMessage(err)`
  qui traduit une erreur de création d'alerte en message clair. Gère le **409**
  (limite d'alertes actives atteinte) avec le `detail` du backend + repli explicite,
  et **ne rend jamais l'objet d'erreur brut** (`[object Object]`) — y compris quand
  le `detail` FastAPI n'est pas une string (tableau de validation 422).
- `src/app/signalement/index.tsx` — le `catch` de `handleConfirm` délègue désormais
  au helper (logique sortie du JSX, conforme aux règles clean code).
- `src/lib/__tests__/alertSubmitError.test.ts` — 5 tests (409 avec/sans detail,
  detail non-string, 401, erreur réseau).

### Added — Types d'alerte en preview (Enlèvement + Comportement suspect envers mineurs)
- 2 nouveaux types d'alerte **en preview visuelle uniquement** (désactivés derrière
  feature flag, non signalables), même traitement que « Bagage oublié » :
  - **Enlèvement** — marqueur ocre `#B45309` 🆘, flag `ABDUCTION_ENABLED` [V2].
  - **Comportement suspect envers mineurs** — marqueur bordeaux `#831843` 🛡️,
    flag `CHILD_SAFETY_ENABLED` [V2]. Libellé volontairement descriptif d'un
    **comportement observable**, jamais une étiquette nominative.
- `constants/config.ts` — `FEATURES.ABDUCTION_ENABLED` + `FEATURES.CHILD_SAFETY_ENABLED`
  (les deux à `false`).
- `constants/colors.ts` — couleurs `abduction` + `childSafety`.
- `constants/theme.ts` — `PREVIEW_ALERT_TYPE_META` étendu (les 2 types).
- `signalement/index.tsx` — sélecteur de type : preview listés par flag (chacun
  visible tant que son flag est off), désactivés + `ComingSoonBadge`.
- `components/map/FilterSheet.tsx` — 2 toggles preview désactivés + `ComingSoonBadge`.
- `lib/__tests__/featureGuards.test.ts` — flags par défaut + garde-fou sur le
  libellé sensible (jamais « pédophile »).
- Aucune logique backend / signalement réel (hors scope).

### Added — CI GitHub Actions
- `.github/workflows/ci-mobile.yml` — CI sur PR vers `dev`/`main` et push sur `dev`,
  symétrique de la CI backend. Trois jobs :
  - `lint-typecheck` — `npm ci` → `tsc --noEmit` → `eslint . --max-warnings 0`
    (container `node:20-bullseye-slim`).
  - `test` — `npm ci` → `jest` (`--watchAll=false --passWithNoTests`), 73 tests
    (container `node:20-bullseye-slim`, `needs: lint-typecheck`).
  - `expo-check` — `expo install --check` via `expo/expo-github-action@v8` sur
    runner natif (mode container non supporté par l'action), `needs: lint-typecheck`.
  - `node_modules` mis en cache (`actions/cache`, clé = hash de `package-lock.json`).
  - Tout échec bloque la PR. Secret optionnel `EXPO_TOKEN`.
- `README.md` / `CLAUDE.md` — section CI.
