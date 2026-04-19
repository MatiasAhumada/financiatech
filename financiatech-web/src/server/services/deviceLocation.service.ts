import { prisma } from "@/lib/prisma";
import { ApiError } from "@/utils/handlers/apiError.handler";
import httpStatus from "http-status";

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: Date;
}

export const deviceLocationService = {
  async saveLocation(serialNumber: string, data: LocationData) {
    const deviceSync = await prisma.deviceSync.findUnique({
      where: { serialNumber },
    });

    if (!deviceSync) {
      throw new ApiError({
        status: httpStatus.NOT_FOUND,
        message: "Dispositivo no encontrado",
      });
    }

    const location = await prisma.deviceLocation.create({
      data: {
        deviceId: deviceSync.deviceId,
        latitude: data.latitude,
        longitude: data.longitude,
        accuracy: data.accuracy,
        timestamp: data.timestamp,
      },
    });

    return location;
  },

  async getLocations(serialNumber: string, limit = 100) {
    const deviceSync = await prisma.deviceSync.findUnique({
      where: { serialNumber },
    });

    if (!deviceSync) {
      throw new ApiError({
        status: httpStatus.NOT_FOUND,
        message: "Dispositivo no encontrado",
      });
    }

    const locations = await prisma.deviceLocation.findMany({
      where: { deviceId: deviceSync.deviceId },
      orderBy: { timestamp: "desc" },
      take: limit,
    });

    return locations;
  },

  async getLastLocation(serialNumber: string) {
    const deviceSync = await prisma.deviceSync.findUnique({
      where: { serialNumber },
    });

    if (!deviceSync) {
      return null;
    }

    const location = await prisma.deviceLocation.findFirst({
      where: { deviceId: deviceSync.deviceId },
      orderBy: { timestamp: "desc" },
    });

    return location;
  },

  async getLocationsByDeviceId(deviceId: string, limit = 100) {
    const locations = await prisma.deviceLocation.findMany({
      where: { deviceId },
      orderBy: { timestamp: "desc" },
      take: limit,
    });

    return locations;
  },
};
