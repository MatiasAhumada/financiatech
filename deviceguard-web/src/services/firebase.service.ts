import admin from "firebase-admin";

let isInitialized = false;

function initializeFirebase() {
  if (isInitialized) return;

  if (admin.apps.length === 0) {
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

  isInitialized = true;
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

  try {
    const message: admin.messaging.Message = {
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: notification.data,
      token,
      android: {
        priority: 'high',
        notification: {
          channelId: 'default',
          priority: 'high',
          visibility: 'public',
          defaultSound: true,
          defaultVibrateTimings: true,
          defaultLightSettings: true,
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    await admin.messaging().send(message);
    return true;
  } catch (error) {
    console.error("[FCM] Error al enviar notificación:", error);
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
    const message: admin.messaging.Message = {
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
