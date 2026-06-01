import { create } from 'zustand';
import { Alert } from '@/types/alert.types';

interface MapStore {
  locateTrigger: number;
  triggerLocate: () => void;
  targetAlert: Alert | null;
  setTargetAlert: (alert: Alert | null) => void;
  ghostAlert: Alert | null;
  setGhostAlert: (alert: Alert | null) => void;
  cameraCenter: { lat: number; lon: number } | null;
  setCameraCenter: (center: { lat: number; lon: number } | null) => void;
}

export const useMapStore = create<MapStore>((set) => ({
  locateTrigger: 0,
  triggerLocate: () => set((s) => ({ locateTrigger: s.locateTrigger + 1 })),
  targetAlert: null,
  setTargetAlert: (alert) => set({ targetAlert: alert }),
  ghostAlert: null,
  setGhostAlert: (alert) => set({ ghostAlert: alert }),
  cameraCenter: null,
  setCameraCenter: (center) => set({ cameraCenter: center }),
}));
