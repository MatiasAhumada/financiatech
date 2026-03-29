import { getMessaging } from "@/lib/firebase";
import { DeviceSyncRepository } from "@/server/repository/deviceSync.repository";

export interface FcmPayload {
  type: "DEVICE_BLOCKED" | "DEVICE_UNBLOCKED";
  deviceId: string;
  imei: string;
  timestamp: string;
}

export const fcmService = {
  async sendToDevice(imei: string, payload: FcmPayload): Promise<boolean> {
    console.log("[FCM-SERVICE] Starting sendToDevice:", {
      imei,
      type: payload.type,
    });

    const deviceSyncRepository = new DeviceSyncRepository();
    const deviceSync = await deviceSyncRepository.findByImei(imei);

    console.log("[FCM-SERVICE] DeviceSync found:", {
      hasDeviceSync: !!deviceSync,
      hasFcmToken: !!deviceSync?.fcmToken,
    });

    if (!deviceSync?.fcmToken) {
      console.log("[FCM-SERVICE] No FCM token found");
      return false;
    }

    try {
      const data: Record<string, string> = {
        type: payload.type,
        deviceId: payload.deviceId,
        imei: payload.imei,
        timestamp: payload.timestamp,
      };

      console.log("[FCM-SERVICE] Sending via Firebase...", {
        token: deviceSync.fcmToken.slice(0, 50) + "...",
      });

      const messaging = getMessaging();
      const response = await messaging.send({
        token: deviceSync.fcmToken,
        data,
        android: {
          priority: "high",
          data,
        },
      });

      console.log("[FCM-SERVICE] Firebase response:", response);
      return true;
    } catch (error) {
      console.error("[FCM-SERVICE] Error sending FCM:", error);
      return false;
    }
  },
};
