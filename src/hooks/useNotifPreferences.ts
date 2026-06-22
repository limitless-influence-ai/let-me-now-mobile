/**
 * [V1.5] Préférences de notification — logique sortie du JSX (clean code).
 *
 * Charge les préférences réelles au montage (GET) et les met à jour côté serveur
 * (PATCH) à chaque modification. Mise à jour optimiste : l'UI réagit tout de
 * suite, et en cas d'échec PATCH on **revient à l'état précédent** + on expose un
 * message d'erreur (format normalisé du backend).
 *
 * Si la feature est éteinte côté serveur, le GET répond 404 → on retombe sur les
 * défauts sans bloquer l'écran (les PATCH échoueront proprement avec un message).
 */
import { useCallback, useEffect, useState } from 'react';
import { NotifPreferences } from '@/types/user.types';
import { preferencesService, DEFAULT_PREFERENCES } from '@/services/preferences.service';

interface ApiErrorLike {
  response?: { data?: { message?: unknown }; status?: number };
}

function readErrorMessage(err: unknown, fallback: string): string {
  const data = (err as ApiErrorLike)?.response?.data;
  return typeof data?.message === 'string' ? data.message : fallback;
}

export function useNotifPreferences() {
  const [prefs, setPrefs] = useState<NotifPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    preferencesService
      .get()
      .then((fresh) => {
        if (active) {
          setPrefs(fresh);
          setError(null);
        }
      })
      .catch((err) => {
        // Feature éteinte / réseau : on garde les défauts, sans casser l'écran.
        if (active) setError(readErrorMessage(err, 'Préférences indisponibles pour le moment.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const update = useCallback(
    async (patch: Partial<NotifPreferences>) => {
      const previous = prefs;
      setPrefs((p) => ({ ...p, ...patch })); // optimiste
      setError(null);
      try {
        const saved = await preferencesService.update(patch);
        setPrefs(saved);
      } catch (err) {
        setPrefs(previous); // revert
        setError(readErrorMessage(err, "Impossible d'enregistrer la préférence."));
      }
    },
    [prefs],
  );

  return { prefs, loading, error, update };
}
