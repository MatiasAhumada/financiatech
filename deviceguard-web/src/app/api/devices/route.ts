import { NextRequest, NextResponse } from "next/server";
import { devicesService } from "@/server/services/devices.service";
import apiErrorHandler, { ApiError } from "@/utils/handlers/apiError.handler";
import { ERROR_MESSAGES } from "@/constants/error-messages.constant";
import { verifyAuth } from "@/utils/auth.middleware";
import httpStatus from "http-status";

export async function GET(request: NextRequest) {
  try {
    verifyAuth(request);
    const devices = await devicesService.findAll();
    return NextResponse.json(devices);
  } catch (error) {
    return apiErrorHandler({ error: error as ApiError, request });
  }
}

export async function POST(request: NextRequest) {
  try {
    verifyAuth(request);
    const body = await request.json();
    const { name, type, status, model, serialNumber, adminId, clientId } = body;

    if (!name || !type || !adminId || !clientId) {
      throw new ApiError({
        status: httpStatus.BAD_REQUEST,
        message: ERROR_MESSAGES.DEVICE_REQUIRED_FIELDS,
      });
    }

    const device = await devicesService.create({
      name,
      type,
      model,
      serialNumber,
      status,
      admin: { connect: { id: adminId } },
      client: { connect: { id: clientId } },
    });

    return NextResponse.json(device, { status: httpStatus.CREATED });
  } catch (error) {
    return apiErrorHandler({ error: error as ApiError, request });
  }
}
