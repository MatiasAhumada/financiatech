import { NextRequest, NextResponse } from "next/server";
import { deviceActivationService } from "@/server/services/deviceActivation.service";
import apiErrorHandler, { ApiError } from "@/utils/handlers/apiError.handler";
import httpStatus from "http-status";
import { z } from "zod";

const createSyncSchema = z.object({
  activationCode: z.string().min(1, "Código requerido"),
  imei: z.string().min(1, "IMEI requerido"),
  fcmToken: z.string().optional(),
});

// Headers CORS para permitir conexiones desde la app mobile
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createSyncSchema.parse(body);

    const result = await deviceActivationService.activate(
      validatedData.activationCode,
      validatedData.imei,
      validatedData.fcmToken
    );

    return NextResponse.json(result, {
      status: httpStatus.CREATED,
      headers: corsHeaders,
    });
  } catch (error) {
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
