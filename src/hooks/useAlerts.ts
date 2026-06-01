import { useState, useCallback } from 'react';
import { useAlertsStore } from '@/store/alerts.store';
import { alertsService } from '@/services/alerts.service';
import { Alert, AlertCreate } from '@/types/alert.types';

export function useAlerts() {
  const { alerts, selectedAlert, setAlerts, addAlert, removeAlert, setSelectedAlert } = useAlertsStore();
  const [myAlerts, setMyAlerts] = useState<Alert[]>([]);

  const fetchAlerts = useCallback(async (lat: number, lon: number, radiusM: number) => {
    const data = await alertsService.list(lat, lon, radiusM);
    setAlerts(data);
  }, [setAlerts]);

  const createAlert = useCallback(async (payload: AlertCreate) => {
    const alert = await alertsService.create(payload);
    addAlert(alert);
    return alert;
  }, [addAlert]);

  const fetchMyAlerts = useCallback(async () => {
    const data = await alertsService.listMine();
    setMyAlerts(data);
  }, []);

  const deleteMyAlert = useCallback(async (id: string) => {
    await alertsService.deleteAlert(id);
    removeAlert(id);
    setMyAlerts((prev) => prev.filter((a) => a.id !== id));
  }, [removeAlert]);

  return { alerts, myAlerts, selectedAlert, fetchAlerts, fetchMyAlerts, createAlert, deleteMyAlert, setSelectedAlert };
}
