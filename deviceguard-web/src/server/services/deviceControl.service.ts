/**
 * Servicio de Control de Dispositivos
 * 
 * Maneja operaciones remotas como bloqueo, desbloqueo, etc.
 * Integración con notificaciones push y WebSockets para comunicación en tiempo real
 */

import { prisma } from "@/lib/prisma";
import { DeviceStatus, NotificationType } from "@prisma/client";

export interface LockDeviceInput {
  deviceId: string;
  reason?: string;
}

export interface UnlockDeviceInput {
  deviceId: string;
}

export interface DeviceControlResponse {
  success: boolean;
  message: string;
  deviceId: string;
  status: DeviceStatus;
}

export const deviceControlService = {
  /**
   * Bloquea remotamente un dispositivo
   * 1. Actualiza el estado del dispositivo a BLOCKED
   * 2. Crea una notificación de bloqueo
   * 3. Intenta enviar un push notification al dispositivo
   * 4. Registra el evento en los logs
   */
  async lockDevice(input: LockDeviceInput): Promise<DeviceControlResponse> {
    const { deviceId, reason } = input;

    try {
      // Verificar que el dispositivo existe
      const device = await prisma.device.findUnique({
        where: { id: deviceId },
        include: {
          client: true,
          sync: true,
          installments: {
            where: { status: "PENDING" },
            orderBy: { dueDate: "asc" },
            take: 1,
          },
        },
      });

      if (!device) {
        throw new Error("Dispositivo no encontrado");
      }

      // Actualizar estado del dispositivo a BLOCKED
      const updatedDevice = await prisma.device.update({
        where: { id: deviceId },
        data: {
          status: DeviceStatus.BLOCKED,
        },
      });

      // Crear notificación de bloqueo si hay una cuota pendiente
      if (device.installments.length > 0) {
        await prisma.notification.create({
          data: {
            deviceId: deviceId,
            installmentId: device.installments[0].id,
            type: NotificationType.BLOCKED,
            message: reason || "El dispositivo ha sido bloqueado debido a impago",
          },
        });
      }

      // TODO: Enviar push notification al dispositivo
      // TODO: Usar Firebase Cloud Messaging o similar para notificar al móvil

      console.log(`[DeviceControl] Dispositivo ${deviceId} bloqueado exitosamente`);

      return {
        success: true,
        message: `Dispositivo ${device.name} bloqueado exitosamente`,
        deviceId: deviceId,
        status: updatedDevice.status,
      };
    } catch (error) {
      console.error(`[DeviceControl] Error bloqueando dispositivo ${deviceId}:`, error);
      throw error;
    }
  },

  /**
   * Desbloquea remotamente un dispositivo
   * 1. Actualiza el estado del dispositivo a SOLD_SYNCED
   * 2. Crea una notificación de desbloqueo
   * 3. Intenta enviar un push notification al dispositivo
   */
  async unlockDevice(input: UnlockDeviceInput): Promise<DeviceControlResponse> {
    const { deviceId } = input;

    try {
      // Verificar que el dispositivo existe
      const device = await prisma.device.findUnique({
        where: { id: deviceId },
        include: {
          installments: {
            where: { status: "PENDING" },
            orderBy: { dueDate: "asc" },
            take: 1,
          },
        },
      });

      if (!device) {
        throw new Error("Dispositivo no encontrado");
      }

      // Actualizar estado del dispositivo a SOLD_SYNCED
      const updatedDevice = await prisma.device.update({
        where: { id: deviceId },
        data: {
          status: DeviceStatus.SOLD_SYNCED,
        },
      });

      // Crear notificación de desbloqueo
      if (device.installments.length > 0) {
        await prisma.notification.create({
          data: {
            deviceId: deviceId,
            installmentId: device.installments[0].id,
            type: NotificationType.WARNING_1,
            message: "El dispositivo ha sido desbloqueado exitosamente",
          },
        });
      }

      // TODO: Enviar push notification al dispositivo

      console.log(`[DeviceControl] Dispositivo ${deviceId} desbloqueado exitosamente`);

      return {
        success: true,
        message: `Dispositivo ${device.name} desbloqueado exitosamente`,
        deviceId: deviceId,
        status: updatedDevice.status,
      };
    } catch (error) {
      console.error(`[DeviceControl] Error desbloqueando dispositivo ${deviceId}:`, error);
      throw error;
    }
  },

  /**
   * Obtiene el estado actual de un dispositivo
   */
  async getDeviceStatus(deviceId: string) {
    try {
      const device = await prisma.device.findUnique({
        where: { id: deviceId },
        include: {
          client: true,
          sync: true,
          installments: {
            where: { status: "PENDING" },
            orderBy: { dueDate: "asc" },
            take: 1,
          },
          blockRule: true,
        },
      });

      if (!device) {
        throw new Error("Dispositivo no encontrado");
      }

      return {
        id: device.id,
        name: device.name,
        status: device.status,
        clientName: device.client?.name,
        isBlocked: device.status === DeviceStatus.BLOCKED,
        isSynced: device.sync !== null,
        lastPing: device.sync?.lastPing,
        pendingInstallment: device.installments[0] || null,
        blockRule: device.blockRule,
      };
    } catch (error) {
      console.error(`[DeviceControl] Error obteniendo estado de ${deviceId}:`, error);
      throw error;
    }
  },

  /**
   * Obtiene todos los dispositivos bloqueados
   */
  async getBlockedDevices(adminId: string) {
    try {
      const blockedDevices = await prisma.device.findMany({
        where: {
          status: DeviceStatus.BLOCKED,
          adminId: adminId,
        },
        include: {
          client: true,
          installments: {
            where: { status: "PENDING" },
            orderBy: { dueDate: "asc" },
            take: 1,
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
      });

      return blockedDevices;
    } catch (error) {
      console.error("[DeviceControl] Error obteniendo dispositivos bloqueados:", error);
      throw error;
    }
  },
};
