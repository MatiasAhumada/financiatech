import { NextRequest, NextResponse } from "next/server";
import { deviceControlService } from "@/server/services/deviceControl.service";
import { fcmService } from "@/lib/fcm";
import "@/lib/firebase"; // Inicializar Firebase Admin
import apiErrorHandler, { ApiError } from "@/utils/handlers/apiError.handler";
import httpStatus from "http-status";
import { z } from "zod";
import { DeviceStatus } from "@prisma/client";
import { DeviceSyncRepository } from "@/server/repository/deviceSync.repository";

const updateDeviceStatusSchema = z.object({
  status: z.nativeEnum(DeviceStatus),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = updateDeviceStatusSchema.parse(body);

    const { status } = validatedData;

    const deviceSyncRepository = new DeviceSyncRepository();
    const deviceSync = await deviceSyncRepository.findByDeviceId(id);

    if (!deviceSync) {
      throw new ApiError({
        status: httpStatus.NOT_FOUND,
        message: "Dispositivo no encontrado",
      });
    }

    const deviceId = deviceSync.deviceId;
    const imei = deviceSync.imei;

    if (status === DeviceStatus.BLOCKED) {
      console.log("[BLOCK] Attempting to lock device:", { deviceId, imei });
      const result = await deviceControlService.lockDevice({ deviceId });
      console.log("[BLOCK] Lock result:", result);

      if (result.success) {
        console.log("[FCM] Sending FCM notification...");
        const fcmSent = await fcmService.sendToDevice(imei, {
          type: "DEVICE_BLOCKED",
          deviceId,
          imei,
          timestamp: new Date().toISOString(),
        });
        console.log("[FCM] FCM sent:", fcmSent);

        return NextResponse.json({
          ...result,
          fcmSent,
          deliveryPending: !fcmSent,
        });
      }
    }

    if (status === DeviceStatus.SOLD_SYNCED) {
      console.log("[UNBLOCK] Attempting to unlock device:", { deviceId, imei });
      const result = await deviceControlService.unlockDevice({ deviceId });
      console.log("[UNBLOCK] Unlock result:", result);

      if (result.success) {
        console.log("[FCM] Sending FCM notification...");
        const fcmSent = await fcmService.sendToDevice(imei, {
          type: "DEVICE_UNBLOCKED",
          deviceId,
          imei,
          timestamp: new Date().toISOString(),
        });
        console.log("[FCM] FCM sent:", fcmSent);

        return NextResponse.json({
          ...result,
          fcmSent,
          deliveryPending: !fcmSent,
        });
      }
    }

    throw new ApiError({
      status: httpStatus.BAD_REQUEST,
      message: "Estado inválido",
    });
  } catch (error) {
    return apiErrorHandler({ error: error as ApiError, request });
  }
}
