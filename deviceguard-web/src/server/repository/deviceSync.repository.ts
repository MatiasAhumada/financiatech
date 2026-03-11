import { prisma } from "@/lib/prisma";
import { IDeviceSync, DeviceStatusCheckResult } from "@/types";
import { DeviceStatus } from "@prisma/client";

interface DeviceSyncWithDetails {
  deviceId: string;
  device: {
    status: DeviceStatus;
    name: string;
    admin: {
      user: {
        name: string;
      };
    };
  };
}

interface DeviceSyncStatusRaw {
  deviceId: string;
  status: DeviceStatus;
  deviceName: string;
  adminName: string;
}

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

  async findDeviceStatusByImei(imei: string): Promise<DeviceSyncStatusRaw | null> {
    const result = await prisma.deviceSync.findUnique({
      where: { imei },
      select: {
        deviceId: true,
        device: {
          select: {
            status: true,
            name: true,
            admin: {
              select: {
                user: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    }) as DeviceSyncWithDetails | null;

    if (!result) {
      return null;
    }

    return {
      deviceId: result.deviceId,
      status: result.device.status,
      deviceName: result.device.name,
      adminName: result.device.admin.user.name,
    };
  }
}
