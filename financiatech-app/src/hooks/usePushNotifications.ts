import { useEffect, useRef, useCallback } from "react";
import { Platform, Alert, Linking } from "react-native";
import { initializeMessaging } from "../services/firebase.service";
import { registerFCMToken } from "../services/notification.service";
import { useDeviceImei } from "./useDeviceImei";

/**
 * Hook para manejar notificaciones push en la app
 * Debe usarse en el _layout.tsx o en el nivel más alto posible
 */
export function usePushNotifications() {
  const initialized = useRef(false);
  const imeiRef = useRef<string | null>(null);
  const tokenRef = useRef<string | null>(null);
  const { serialNumber, isReady } = useDeviceImei();

  const sendTokenToBackend = useCallback(async (token: string, imei: string) => {
    try {
      await registerFCMToken({
        fcmToken: token,
        imei,
      });
    } catch (error: any) {
      console.error("[FCM] Error al enviar token:", error?.response?.data);
    }
  }, []);

  useEffect(() => {
    if (initialized.current || !isReady || !serialNumber) return;
    initialized.current = true;

    const initialize = async () => {
      try {
        imeiRef.current = serialNumber;

        const token = await initializeMessaging({
          onMessageReceived: (message) => {
            if (Platform.OS === "android") {
              Alert.alert(message.notification?.title || "Nueva notificación", message.notification?.body || "", [{ text: "OK" }], {
                cancelable: true,
              });
            }
          },
          onNotificationOpened: (message) => {
            const deviceId = message.data?.deviceId;
          },
          onTokenRefresh: async (newToken) => {
            tokenRef.current = newToken;
            if (imeiRef.current) {
              await sendTokenToBackend(newToken, imeiRef.current);
            }
          },
        });

        if (token && serialNumber) {
          tokenRef.current = token;
          await sendTokenToBackend(token, serialNumber);
        }
      } catch (error: any) {
        console.error("[NOTIFICATION] Error al inicializar:", error);
      }
    };

    initialize();
  }, [sendTokenToBackend, isReady, serialNumber]);
}
