import { NextRequest, NextResponse } from "next/server";
import { deviceActivationService } from "@/server/services/deviceActivation.service";
import apiErrorHandler, { ApiError } from "@/utils/handlers/apiError.handler";
import httpStatus from "http-status";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ imei: string }> }
) {
  try {
    const { imei } = await params;

    // `status` now contains `blocked`, `status`, `message` and
    // `pendingAmount` (ultimo monto pendiente) so the mobile app can show it.
    const status = await deviceActivationService.checkStatus(imei);

    return NextResponse.json(status, { status: httpStatus.OK });
  } catch (error) {
    return apiErrorHandler({ error: error as ApiError, request });
  }
}
