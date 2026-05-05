import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import httpStatus from "http-status";
import apiErrorHandler, { ApiError } from "@/utils/handlers/apiError.handler";
import {
  registerFCMTokenSchema,
  RegisterFCMTokenDto,
} from "@/schemas/fcmToken.schema";

// Headers CORS para permitir conexiones desde la app mobile
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

/**
 * POST /api/device-syncs/fcm-token
 * Registra o actualiza el token FCM de un dispositivo
 *
 * El imei debe ser el mismo que se usó durante la activación del dispositivo
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("[FCM-TOKEN] ========================================");
    console.log("[FCM-TOKEN] Nueva solicitud de registro de token");
    console.log("[FCM-TOKEN] Timestamp:", new Date().toISOString());
    console.log("[FCM-TOKEN] Request body:", JSON.stringify(body, null, 2));
    
    const validatedData = registerFCMTokenSchema.parse(body);
    console.log("[FCM-TOKEN] Validated data:", JSON.stringify(validatedData, null, 2));
    console.log("[FCM-TOKEN] IMEI/Serial:", validatedData.imei);
    console.log("[FCM-TOKEN] Token (primeros 50 chars):", validatedData.fcmToken.substring(0, 50) + "...");

    let deviceSync = await prisma.deviceSync.findUnique({
      where: { serialNumber: validatedData.imei },
      include: {
        device: true,
      },
    });

    if (deviceSync) {
      console.log("[FCM-TOKEN] ✓ DeviceSync encontrado");
      console.log("[FCM-TOKEN] DeviceSync ID:", deviceSync.id);
      console.log("[FCM-TOKEN] Device ID:", deviceSync.deviceId);
      console.log("[FCM-TOKEN] Device Name:", deviceSync.device?.name || "N/A");
      console.log("[FCM-TOKEN] Token anterior (primeros 50):", deviceSync.fcmToken?.substring(0, 50) + "..." || "NULL");
      console.log("[FCM-TOKEN] Token nuevo (primeros 50):", validatedData.fcmToken.substring(0, 50) + "...");
      
      const tokenChanged = deviceSync.fcmToken !== validatedData.fcmToken;
      console.log("[FCM-TOKEN] ¿Token cambió?:", tokenChanged);
      
      deviceSync = await prisma.deviceSync.update({
        where: { id: deviceSync.id },
        data: { 
          fcmToken: validatedData.fcmToken,
          lastPing: new Date(), // Actualizar también el lastPing
        },
        include: {
          device: true,
        },
      });
      
      console.log("[FCM-TOKEN] ✓ Token actualizado exitosamente en la base de datos");
      console.log("[FCM-TOKEN] Token guardado (primeros 50):", deviceSync.fcmToken?.substring(0, 50) + "...");
      console.log("[FCM-TOKEN] ========================================");
    } else {
      console.log("[FCM-TOKEN] ✗ DeviceSync NO encontrado para IMEI:", validatedData.imei);
      console.log("[FCM-TOKEN] ========================================");
      throw new ApiError({
        status: httpStatus.NOT_FOUND,
        message:
          "Dispositivo no encontrado. Asegúrate de haber completado la activación con el código de activación.",
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: "Token FCM registrado exitosamente",
        deviceSync,
      },
      {
        status: httpStatus.OK,
        headers: corsHeaders,
      }
    );
  } catch (error: any) {
    console.error("[FCM-TOKEN] ✗ Error:", error);
    console.log("[FCM-TOKEN] ========================================");
    return apiErrorHandler({ error: error as ApiError, request });
  }
}

// Manejar preflight requests
export async function OPTIONS() {
  return NextResponse.json(null, {
    status: 204,
    headers: corsHeaders,
  });
}
