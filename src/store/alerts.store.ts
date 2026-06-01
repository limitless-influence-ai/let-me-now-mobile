import { create } from 'zustand';
import { Alert } from '@/types/alert.types';

interface AlertsState {
  alerts: Alert[];
  selectedAlert: Alert | null;
  setAlerts: (alerts: Alert[]) => void;
  addAlert: (alert: Alert) => void;
  updateAlert: (id: string, updates: Partial<Alert>) => void;
  removeAlert: (id: string) => void;
  setSelectedAlert: (alert: Alert | null) => void;
}

export const useAlertsStore = create<AlertsState>((set) => ({
  alerts: [],
  selectedAlert: null,
  setAlerts: (alerts) => set({ alerts }),
  addAlert: (alert) => set((state) => ({ alerts: [alert, ...state.alerts] })),
  updateAlert: (id, updates) =>
    set((state) => ({
      alerts: state.alerts.map((a) => (a.id === id ? { ...a, ...updates } : a)),
      selectedAlert: state.selectedAlert?.id === id ? { ...state.selectedAlert, ...updates } : state.selectedAlert,
    })),
  removeAlert: (id) => set((state) => ({ alerts: state.alerts.filter((a) => a.id !== id) })),
  setSelectedAlert: (selectedAlert) => set({ selectedAlert }),
}));
