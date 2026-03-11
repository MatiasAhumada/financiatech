import { prisma } from "@/lib/prisma";
import { cache } from "@/lib/cache";
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
  async lockDevice(input: LockDeviceInput): Promise<DeviceControlResponse> {
    const { deviceId, reason } = input;

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
        },
      });

      if (!device) {
        throw new Error("Dispositivo no encontrado");
      }

      const updatedDevice = await prisma.device.update({
        where: { id: deviceId },
        data: {
          status: DeviceStatus.BLOCKED,
        },
      });

      if (device.installments.length > 0) {
        await prisma.notification.create({
          data: {
            deviceId: deviceId,
            installmentId: device.installments[0].id,
            type: NotificationType.BLOCKED,
            message:
              reason || "El dispositivo ha sido bloqueado debido a impago",
          },
        });
      }

      if (device.sync) {
        cache.invalidateDevice(device.sync.imei);

        await prisma.pendingCommand.create({
          data: {
            deviceId: device.sync.deviceId,
            type: "DEVICE_BLOCKED",
            status: "PENDING",
            sentAt: new Date(),
          },
        });
      }

      return {
        success: true,
        message: `Dispositivo ${device.name} bloqueado exitosamente`,
        deviceId: deviceId,
        status: updatedDevice.status,
      };
    } catch (error) {
      console.error(
        `[DeviceControl] Error bloqueando dispositivo ${deviceId}:`,
        error
      );
      throw error;
    }
  },

  async unlockDevice(input: UnlockDeviceInput): Promise<DeviceControlResponse> {
    const { deviceId } = input;

    try {
      const device = await prisma.device.findUnique({
        where: { id: deviceId },
        include: {
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

      const updatedDevice = await prisma.device.update({
        where: { id: deviceId },
        data: {
          status: DeviceStatus.SOLD_SYNCED,
        },
      });

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

      if (device.sync) {
        cache.invalidateDevice(device.sync.imei);

        await prisma.pendingCommand.create({
          data: {
            deviceId: device.sync.deviceId,
            type: "DEVICE_UNBLOCKED",
            status: "PENDING",
            sentAt: new Date(),
          },
        });
      }

      return {
        success: true,
        message: `Dispositivo ${device.name} desbloqueado exitosamente`,
        deviceId: deviceId,
        status: updatedDevice.status,
      };
    } catch (error) {
      console.error(
        `[DeviceControl] Error desbloqueando dispositivo ${deviceId}:`,
        error
      );
      throw error;
    }
  },

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
      console.error(
        `[DeviceControl] Error obteniendo estado de ${deviceId}:`,
        error
      );
      throw error;
    }
  },

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
      console.error(
        "[DeviceControl] Error obteniendo dispositivos bloqueados:",
        error
      );
      throw error;
    }
  },
};
