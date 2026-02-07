import { NextRequest, NextResponse } from "next/server";
import { devicesService } from "@/server/services/devices.service";
import apiErrorHandler, { ApiError } from "@/utils/handlers/apiError.handler";
import { ERROR_MESSAGES } from "@/constants/error-messages.constant";
import { verifyAuth } from "@/utils/auth.middleware";
import httpStatus from "http-status";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    verifyAuth(request);
    const device = await devicesService.findById(params.id);

    if (!device) {
      throw new ApiError({
        status: httpStatus.NOT_FOUND,
        message: ERROR_MESSAGES.NOT_FOUND,
      });
    }

    return NextResponse.json(device);
  } catch (error) {
    return apiErrorHandler({ error: error as ApiError, request });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    verifyAuth(request);
    const body = await request.json();
    const { name, type, status } = body;

    const device = await devicesService.update(params.id, {
      name,
      type,
      status,
    });

    return NextResponse.json(device);
  } catch (error) {
    return apiErrorHandler({ error: error as ApiError, request });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    verifyAuth(request);
    await devicesService.delete(params.id);
    return NextResponse.json({ message: "Device deleted successfully" });
  } catch (error) {
    return apiErrorHandler({ error: error as ApiError, request });
  }
}
