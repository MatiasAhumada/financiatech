import { getMessaging } from "@/lib/firebase";

/**
 * Envía una notificación push a un dispositivo
 */
export async function sendPushNotification(
  token: string,
  notification: {
    title: string;
    body: string;
    data?: Record<string, string>;
  }
): Promise<boolean> {
  const messaging = getMessaging();

  console.log("[FCM-SEND] Attempting to send notification");
  console.log("[FCM-SEND] Token:", token);
  console.log("[FCM-SEND] Title:", notification.title);
  console.log("[FCM-SEND] Body:", notification.body);
  console.log("[FCM-SEND] Data:", JSON.stringify(notification.data));

  try {
    const message = {
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: notification.data,
      token,
      android: {
        priority: "high" as const,
        notification: {
          channelId: "default",
          priority: "high" as const,
          visibility: "public" as const,
          defaultSound: true,
          defaultVibrateTimings: true,
          defaultLightSettings: true,
        },
      },
      apns: {
        payload: {
          aps: {
            sound: "default",
            badge: 1,
          },
        },
      },
    };

    await messaging.send(message);
    console.log("[FCM-SEND] Notification sent successfully");
    return true;
  } catch (error) {
    console.error("[FCM-SEND] Error al enviar notificación:", error);
    return false;
  }
}

/**
 * Envía notificaciones a múltiples dispositivos (topic)
 */
export async function sendTopicNotification(
  topic: string,
  notification: {
    title: string;
    body: string;
    data?: Record<string, string>;
  }
): Promise<boolean> {
  const messaging = getMessaging();

  try {
    const message = {
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: notification.data,
      topic,
    };

    await messaging.send(message);
    return true;
  } catch (error) {
    console.error("[FCM] Error al enviar notificación a topic:", error);
    return false;
  }
}
