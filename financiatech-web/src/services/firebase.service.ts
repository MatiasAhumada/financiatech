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

  console.log("[FCM-SEND] ========================================");
  console.log("[FCM-SEND] Intentando enviar notificación");
  console.log("[FCM-SEND] Timestamp:", new Date().toISOString());
  console.log("[FCM-SEND] Token (primeros 50):", token.substring(0, 50) + "...");
  console.log("[FCM-SEND] Title:", notification.title);
  console.log("[FCM-SEND] Body:", notification.body);
  console.log("[FCM-SEND] Data:", JSON.stringify(notification.data));

  try {
    // Enviar SOLO data (sin notification) para que onMessageReceived() siempre se ejecute
    // Esto permite que el servicio Java maneje la notificación tanto en foreground como background
    const message = {
      data: {
        title: notification.title,
        body: notification.body,
        ...(notification.data || {}),
      },
      token,
      android: {
        priority: "high" as const,
      },
      apns: {
        payload: {
          aps: {
            sound: "default",
            badge: 1,
            contentAvailable: true,
          },
        },
      },
    };

    console.log("[FCM-SEND] Enviando mensaje a Firebase...");
    const response = await messaging.send(message);
    console.log("[FCM-SEND] ✓ Respuesta de Firebase:", response);
    console.log("[FCM-SEND] ✓ Notificación enviada exitosamente");
    console.log("[FCM-SEND] ========================================");
    return true;
  } catch (error: any) {
    console.error("[FCM-SEND] ✗ Error al enviar notificación:");
    console.error("[FCM-SEND] Error code:", error?.code);
    console.error("[FCM-SEND] Error message:", error?.message);
    console.error("[FCM-SEND] Error details:", error);
    console.log("[FCM-SEND] ========================================");
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
    // Enviar SOLO data (sin notification) para que onMessageReceived() siempre se ejecute
    const message = {
      data: {
        title: notification.title,
        body: notification.body,
        ...(notification.data || {}),
      },
      topic,
      android: {
        priority: "high" as const,
      },
    };

    await messaging.send(message);
    return true;
  } catch (error) {
    console.error("[FCM] Error al enviar notificación a topic:", error);
    return false;
  }
}
