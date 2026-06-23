import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import * as Sentry from '@sentry/react-native';
import {
  FOREGROUND_NOTIFICATION_BEHAVIOR,
  pushTapTarget,
} from '@/lib/pushNotifications';

// Set the foreground presentation behaviour once, at module load. This is a
// global registration (not per-render), so it must live outside the hook body.
Notifications.setNotificationHandler({
  handleNotification: async () => FOREGROUND_NOTIFICATION_BEHAVIOR,
});

/**
 * Mount once app-wide (root layout). Wires the two reception listeners so an
 * incoming push is actually exploited by the app:
 *
 * - received  : push arrives while the app is in the foreground. The OS banner
 *   is handled by `setNotificationHandler`; this listener is the hook point for
 *   future work (refresh the unread badge / alerts list).
 * - response  : the user taps a notification (app background/closed) → navigate
 *   to the screen derived from the push payload.
 *
 * Without these, a delivered push is shown by the OS but never drives the app
 * (no in-app refresh, no tap → navigation).
 */
export function usePushNotifications(): void {
  const router = useRouter();

  useEffect(() => {
    const receivedSub = Notifications.addNotificationReceivedListener(() => {
      // No-op for now: the OS banner is enough. Kept as the extension point
      // for refreshing the in-app unread count on foreground delivery.
    });

    const responseSub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        try {
          const data = response.notification.request.content.data as
            | Record<string, unknown>
            | undefined;
          router.push(pushTapTarget(data));
        } catch (err) {
          // Navigation can throw if the router isn't ready yet — never crash on
          // a notification tap, just report it.
          Sentry.captureException(err);
        }
      },
    );

    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, [router]);
}
