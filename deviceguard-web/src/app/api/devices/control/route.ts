import { NextRequest, NextResponse } from "next/server";
import { deviceControlService } from "@/server/services/deviceControl.service";
import apiErrorHandler, { ApiError } from "@/utils/handlers/apiError.handler";
import { requireRole } from "@/utils/auth.middleware";
import httpStatus from "http-status";
import { UserRole } from "@prisma/client";
import { z } from "zod";

// Schema para validar la solicitud de bloqueo
const lockDeviceSchema = z.object({
  deviceId: z.string().min(1, "Device ID requerido"),
  reason: z.string().optional(),
});

const unlockDeviceSchema = z.object({
  deviceId: z.string().min(1, "Device ID requerido"),
});

/**
 * GET /api/devices/control/[id]/status
 * Obtiene el estado actual de un dispositivo
 */
export async function GET(request: NextRequest) {
  try {
    const payload = requireRole(request, [UserRole.ADMIN]);
    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get("deviceId");

    if (!deviceId) {
      return NextResponse.json(
        { error: "deviceId es requerido" },
        { status: httpStatus.BAD_REQUEST }
      );
    }

    const status = await deviceControlService.getDeviceStatus(deviceId);
    return NextResponse.json(status, { status: httpStatus.OK });
  } catch (error) {
    return apiErrorHandler({ error: error as ApiError, request });
  }
}

/**
 * POST /api/devices/control/lock
 * Bloquea un dispositivo de forma remota
 * 
 * Body:
 * {
 *   "deviceId": "device-id",
 *   "reason": "Impago de cuota" (opcional)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const payload = requireRole(request, [UserRole.ADMIN]);
    const body = await request.json();

    // Validar si es un bloqueo o desbloqueo basándose en el path
    const url = new URL(request.url);
    const isLocking = url.pathname.includes("/lock");

    if (isLocking) {
      const validatedData = lockDeviceSchema.parse(body);

      const result = await deviceControlService.lockDevice({
        deviceId: validatedData.deviceId,
        reason: validatedData.reason,
      });

      return NextResponse.json(result, { status: httpStatus.OK });
    } else {
      // Es un desbloqueo
      const validatedData = unlockDeviceSchema.parse(body);

      const result = await deviceControlService.unlockDevice({
        deviceId: validatedData.deviceId,
      });

      return NextResponse.json(result, { status: httpStatus.OK });
    }
  } catch (error) {
    return apiErrorHandler({ error: error as ApiError, request });
  }
}
