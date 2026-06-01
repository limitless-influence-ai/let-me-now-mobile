export type AlertType = 'AGRESSION' | 'AGRESSION_HOMOPHOBE' | 'PICKPOCKET' | 'CACTUS';
export type AlertStatus = 'active' | 'expired' | 'removed';
export type VoteType = 'CONFIRM' | 'INVALIDATE';

export interface Alert {
  id: string;
  userId: string;
  type: AlertType;
  lat: number;
  lon: number;
  locationLabel: string;
  status: AlertStatus;
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
  comment: string | null;
  photoUrl: string | null;
  radiusM: number;
}

/**
 * Server → client real-time messages over the alerts WebSocket.
 *
 * Discriminated on `event` (see WS_REALTIME_CONTRACT.md §2). For `new_alert`
 * and `alert_updated`, `alert` is the SAME raw snake_case payload as the REST
 * API (`AlertResponse`) — it must be passed through `mapAlert(...)` before
 * reaching the store. Typed as `Record<string, unknown>` to match `mapAlert`'s
 * signature without churn.
 */
export type WsServerMessage =
  | { event: 'new_alert'; alert: Record<string, unknown> }
  | { event: 'alert_updated'; alert: Record<string, unknown> }
  | { event: 'alert_expired'; alert_id: string }
  | { event: 'alert_removed'; alert_id: string }
  | { event: 'pong' };

export interface AlertCreate {
  type: AlertType;
  lat: number;
  lon: number;
  locationLabel: string;
  comment?: string | null;
  radiusM?: number;
}
