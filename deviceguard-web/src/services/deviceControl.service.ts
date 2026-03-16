import clientAxios from "@/utils/clientAxios.util";
import { DeviceStatus } from "@prisma/client";

export interface DeviceControlResponse {
  success: boolean;
  message: string;
  deviceId: string;
  status: DeviceStatus;
  fcmSent: boolean;
  deliveryPending: boolean;
}

export interface DeviceStatusResponse {
  id: string;
  name: string;
  status: DeviceStatus;
  clientName: string;
  isBlocked: boolean;
  isSynced: boolean;
  pendingAmount: number;
}

export const deviceControlService = {
  async lockDevice(deviceId: string): Promise<DeviceControlResponse> {
    const { data } = await clientAxios.patch(
      `/api/devices/${deviceId}/status`,
      {
        status: "BLOCKED",
      }
    );
    return data;
  },

  async unlockDevice(deviceId: string): Promise<DeviceControlResponse> {
    const { data } = await clientAxios.patch(
      `/api/devices/${deviceId}/status`,
      {
        status: "SOLD_SYNCED",
      }
    );
    return data;
  },

  async getDeviceStatus(deviceId: string): Promise<DeviceStatusResponse> {
    const { data } = await clientAxios.get(`/api/device-syncs/${deviceId}`);
    return {
      id: data.deviceId,
      name: data.deviceName,
      status: data.status,
      clientName: data.adminName,
      isBlocked: data.blocked,
      isSynced: true,
      pendingAmount: data.pendingAmount,
    };
  },
};
