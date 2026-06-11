# CLAUDE.md — lmk-mobile

Repo mobile de **Let Me Know (LMK)**. Conception complète : [github.com/kakotodev/LMK](https://github.com/kakotodev/LMK).

## Stack

React Native (Expo Prebuild) · Expo Router · TypeScript · Zustand · Axios · WebSocket

## Structure

```
src/
  app/                          ← Routes Expo Router (= écrans) — chaque écran = dossier + index.tsx
    (tabs)/
      carte/index.tsx           ← Écran 02 — Carte principale
      alertes/index.tsx         ← Écran 10 — Liste notifications
      profil/index.tsx          ← Écran 11 — Profil + Paramètres
    auth/
      connexion/index.tsx       ← Écran 07
      inscription/index.tsx     ← Écran 08
      verification/index.tsx    ← Écran 09
    signalement/index.tsx       ← Écran 04
    index.tsx                   ← Écran 01 — Splash
    _layout.tsx                 ← Header + Footer définis ICI UNIQUEMENT
  components/
    shared/
      Header.tsx
      FAB.tsx
      BottomSheet.tsx
    ui/
      Button.tsx
      Input.tsx
      Badge.tsx
    map/
      AlertMarker.tsx
      AlertDetailSheet.tsx
      FilterSheet.tsx
    alerts/
      AlertCard.tsx
    cactus/
      CactusPopup.tsx
  hooks/
    useLocation.ts
    useAlerts.ts
    useAuth.ts
    useWebSocket.ts
  services/
    api.ts                      ← Instance axios centralisée
    auth.service.ts
    alerts.service.ts
  store/
    auth.store.ts
    alerts.store.ts
  types/
    alert.types.ts
    user.types.ts
  constants/
    colors.ts
    config.ts
```

## Règles clean code

1. Chaque écran = **un dossier + `index.tsx`** — jamais `page.tsx`
2. `_layout.tsx` est la **seule source** pour Header et Footer
3. Logique métier dans les **hooks** — jamais inline dans le JSX
4. Services = **API only** — aucun `useState`, aucune transformation
5. Magic numbers dans `constants/config.ts` — jamais hardcodés

## Conventions

- **Branches** : `agent/<verbe-sujet>` pour les agents, `feature/<verbe-sujet>` pour les humains
- **PRs** vers `dev` uniquement
- **Commits** : Conventional Commits
- **Linter** : ESLint + TypeScript strict
- **CI/CD** : `.github/workflows/ci-mobile.yml` (PR → `dev`/`main` + push `dev`) : `tsc --noEmit` + `eslint . --max-warnings 0` + `jest` + `expo install --check`. Voir README.
- **Variables d'env** : préfixées `EXPO_PUBLIC_`

## Variables d'environnement

```
EXPO_PUBLIC_API_URL=http://localhost:8000
EXPO_PUBLIC_SENTRY_DSN=
EXPO_PUBLIC_MAPS_API_KEY=
```

## Couleurs alertes

- Agression : `#E53935` (rouge)
- Agression homophobe : `#8E24AA` (violet)
- Pickpocket : `#FB8C00` (orange)
- Cactus : `#43A047` (vert)

### Types en preview (désactivés derrière feature flag)

Affichés mais non signalables — pastille `ComingSoonBadge` « Bientôt », opacity 0.5
dans le sélecteur de signalement et le bottom sheet filtres. Métadonnées dans
`PREVIEW_ALERT_TYPE_META` (`constants/theme.ts`), flags dans `FEATURES`
(`constants/config.ts`). Promouvoir = déplacer dans `ALERT_TYPE_META` + étendre
l'union `AlertType` (et l'enum backend).

- Bagage oublié : `#1E3A8A` (bleu marine) 🧳 — `LOST_LUGGAGE_ENABLED` [V1.5]
- Enlèvement : `#B45309` (ocre) 🆘 — `ABDUCTION_ENABLED` [V2]
- Comportement suspect envers mineurs : `#831843` (bordeaux) 🛡️ — `CHILD_SAFETY_ENABLED` [V2]

> ⚠️ **Libellé sensible** : le type child-safety décrit un **comportement
> observable en cours**, jamais une étiquette nominative sur une personne. Le
> libellé est volontairement « Comportement suspect envers mineurs » — ne jamais
> employer de terme accusatoire (ex. « pédophile »). La feature étant désactivée
> (preview), aucun signalement réel n'est possible.
