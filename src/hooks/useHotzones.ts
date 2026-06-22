/**
 * [V1.5] Zones chaudes — logique sortie du JSX (clean code).
 *
 * Récupère les zones chaudes au montage et les rafraîchit quand `refreshKey`
 * change (ex: à chaque re-fetch des alertes). Best-effort : si la feature est
 * éteinte (404) ou en cas d'erreur réseau, on retombe sur une liste vide sans
 * casser la carte.
 */
import { useEffect, useState } from 'react';
import { HotZone } from '@/types/hotzone.types';
import { hotzonesService } from '@/services/hotzones.service';

export function useHotzones(refreshKey: unknown = null) {
  const [hotzones, setHotzones] = useState<HotZone[]>([]);

  useEffect(() => {
    let active = true;
    hotzonesService
      .list()
      .then((zones) => {
        if (active) setHotzones(zones);
      })
      .catch(() => {
        if (active) setHotzones([]); // feature off / réseau → pas de zones
      });
    return () => {
      active = false;
    };
  }, [refreshKey]);

  return hotzones;
}
