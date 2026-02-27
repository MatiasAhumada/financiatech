import { prisma } from "@/lib/prisma";
import { IDeviceSync } from "@/types";

export class DeviceSyncRepository {
  async create(deviceId: string, imei: string): Promise<IDeviceSync> {
    return prisma.deviceSync.create({
      data: {
        deviceId,
        imei,
      },
      include: {
        device: true,
      },
    });
  }

  async findByImei(imei: string): Promise<IDeviceSync | null> {
    return prisma.deviceSync.findUnique({
      where: { imei },
      include: {
        device: true,
      },
    });
  }

  async updateLastPing(deviceId: string) {
    return prisma.deviceSync.update({
      where: { deviceId },
      data: { lastPing: new Date() },
    });
  }

  /**
   * Obtiene el deviceSync con toda la información necesaria:
   * - device completo con su admin y usuario
   * - sincronización del dispositivo
   */
  async findByImeiWithDetails(imei: string) {
    return prisma.deviceSync.findUnique({
      where: { imei },
      include: {
        device: {
          include: {
            admin: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });
  }
}
