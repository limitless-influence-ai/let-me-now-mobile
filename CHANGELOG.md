# Changelog — lmk-mobile

Toutes les modifications notables de ce dépôt sont documentées ici.
Format inspiré de [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

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
