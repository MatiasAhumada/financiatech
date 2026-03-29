import admin from "firebase-admin";
import { App } from "firebase-admin/app";

let adminInstance: App | null = null;

export function getFirebaseAdmin(): App {
  if (!adminInstance) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error(
        "Faltan credenciales de Firebase. Verificar FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL y FIREBASE_PRIVATE_KEY en .env"
      );
    }

    adminInstance = admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  }

  return adminInstance;
}

export function getMessaging() {
  return admin.messaging();
}

export { admin };
