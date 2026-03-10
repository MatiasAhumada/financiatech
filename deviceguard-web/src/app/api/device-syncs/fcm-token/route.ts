import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import httpStatus from "http-status";
import apiErrorHandler, { ApiError } from "@/utils/handlers/apiError.handler";
import { registerFCMTokenSchema, RegisterFCMTokenDto } from "@/schemas/fcmToken.schema";

// Headers CORS para permitir conexiones desde la app mobile
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
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
    const validatedData = registerFCMTokenSchema.parse(body);

    let deviceSync = await prisma.deviceSync.findUnique({
      where: { imei: validatedData.imei },
      include: {
        device: true,
      },
    });

    if (deviceSync) {
      deviceSync = await prisma.deviceSync.update({
        where: { id: deviceSync.id },
        data: { fcmToken: validatedData.fcmToken },
        include: {
          device: true,
        },
      });
    } else {
      throw new ApiError({
        status: httpStatus.NOT_FOUND,
        message: 'Dispositivo no encontrado. Asegúrate de haber completado la activación con el código de activación.',
      });
    }

    return NextResponse.json({
      success: true,
      message: "Token FCM registrado exitosamente",
      deviceSync,
    }, { 
      status: httpStatus.OK,
      headers: corsHeaders,
    });
  } catch (error: any) {
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
