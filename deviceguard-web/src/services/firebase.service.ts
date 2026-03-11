/**
 * Servicio para enviar notificaciones push a través de Firebase Cloud Messaging
 */

import * as admin from "firebase-admin";

// Flag para trackear si Firebase está inicializado
let isFirebaseInitialized = false;

// Inicializar Firebase Admin SDK
function initializeFirebase() {
  if (isFirebaseInitialized) {
    return admin;
  }

  // Inicializar solo si no está ya inicializado
  if (admin.apps.length === 0) {
    // Usar variables de entorno para las credenciales de Firebase
    const firebaseConfig = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    };

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: firebaseConfig.projectId,
        clientEmail: firebaseConfig.clientEmail,
        privateKey: firebaseConfig.privateKey,
      }),
    });
  }

  isFirebaseInitialized = true;
  return admin;
}

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
  initializeFirebase();

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

    await admin.messaging().send(message);
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
  initializeFirebase();

  try {
    const message = {
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: notification.data,
      topic,
    };

    await admin.messaging().send(message);
    return true;
  } catch (error) {
    console.error("[FCM] Error al enviar notificación a topic:", error);
    return false;
  }
}
