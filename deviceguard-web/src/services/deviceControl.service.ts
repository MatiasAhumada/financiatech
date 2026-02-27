/**
 * Servicio de Control de Dispositivos (Cliente)
 * Llama a los endpoints de la API para bloquear/desbloquear dispositivos
 */

import clientAxios from "@/utils/clientAxios.util";

interface LockDeviceRequest {
  deviceId: string;
  reason?: string;
}

interface DeviceControlResponse {
  success: boolean;
  message: string;
  deviceId: string;
  status: string;
}

interface DeviceStatusResponse {
  id: string;
  name: string;
  status: string;
  clientName: string;
  isBlocked: boolean;
  isSynced: boolean;
  lastPing?: Date;
  pendingInstallment?: any;
  blockRule?: any;
}

export const deviceControlService = {
  /**
   * Bloquea un dispositivo de forma remota
   * POST /api/devices/control
   */
  async lockDevice(
    deviceId: string,
    reason?: string
  ): Promise<DeviceControlResponse> {
    const { data } = await clientAxios.post("/api/devices/control/lock", {
      deviceId,
      reason: reason || "El dispositivo ha sido bloqueado",
    });
    return data;
  },

  /**
   * Desbloquea un dispositivo de forma remota
   * POST /api/devices/control/unlock
   */
  async unlockDevice(deviceId: string): Promise<DeviceControlResponse> {
    const { data } = await clientAxios.post("/api/devices/control/unlock", {
      deviceId,
    });
    return data;
  },

  /**
   * Obtiene el estado actual de un dispositivo
   * GET /api/devices/control?deviceId=...
   */
  async getDeviceStatus(deviceId: string): Promise<DeviceStatusResponse> {
    const { data } = await clientAxios.get("/api/devices/control", {
      params: { deviceId },
    });
    return data;
  },
};
