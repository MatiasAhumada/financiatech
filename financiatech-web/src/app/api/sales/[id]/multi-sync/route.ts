import { NextRequest, NextResponse } from "next/server";
import { deviceActivationService } from "@/server/services/deviceActivation.service";
import apiErrorHandler, { ApiError } from "@/utils/handlers/apiError.handler";
import httpStatus from "http-status";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: activationCode } = await params;

    const result =
      await deviceActivationService.getMultiSyncStatus(activationCode);

    return NextResponse.json(result, { status: httpStatus.OK });
  } catch (error) {
    return apiErrorHandler({ error: error as ApiError, request });
  }
}
