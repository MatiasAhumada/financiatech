import { NextRequest, NextResponse } from "next/server";
import { deviceActivationService } from "@/server/services/deviceActivation.service";
import apiErrorHandler, { ApiError } from "@/utils/handlers/apiError.handler";
import httpStatus from "http-status";

/**
 * GET /api/sales/{activationCode}/sync
 *
 * Consulta si la venta identificada por `activationCode` ya tiene
 * su dispositivo vinculado (DeviceSync creado + estado SOLD_SYNCED).
 *
 * Usado por el polling del SaleModal (ActivationCodeDisplay) para
 * detectar en tiempo casi-real cuándo el celular se vincula.
 *
 * No requiere auth: el activationCode actúa como token de acceso temporal.
 *
 * Respuesta:
 *   200 { synced: false, deviceName: string }  →  aún esperando
 *   200 { synced: true,  deviceName: string }  →  vinculado exitosamente
 *   404                                         →  código no existe
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ activationCode: string }> }
) {
  try {
    const { activationCode } = await params;

    const result = await deviceActivationService.getSyncStatus(activationCode);

    return NextResponse.json(result, { status: httpStatus.OK });
  } catch (error) {
    return apiErrorHandler({ error: error as ApiError, request });
  }
}
