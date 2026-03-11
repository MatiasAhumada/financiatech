import admin from "firebase-admin";
import { DeviceSyncRepository } from "@/server/repository/deviceSync.repository";

export interface FcmPayload {
  type: "DEVICE_BLOCKED" | "DEVICE_UNBLOCKED";
  deviceId: string;
  imei: string;
  timestamp: string;
}

export const fcmService = {
  async sendToDevice(imei: string, payload: FcmPayload): Promise<boolean> {
    const deviceSyncRepository = new DeviceSyncRepository();
    const deviceSync = await deviceSyncRepository.findByImei(imei);

    if (!deviceSync?.fcmToken) {
      return false;
    }

    try {
      const data: Record<string, string> = {
        type: payload.type,
        deviceId: payload.deviceId,
        imei: payload.imei,
        timestamp: payload.timestamp,
      };

      await admin.messaging().send({
        token: deviceSync.fcmToken,
        data,
        android: {
          priority: "high",
          data,
        },
      });

      return true;
    } catch {
      return false;
    }
  },
};
