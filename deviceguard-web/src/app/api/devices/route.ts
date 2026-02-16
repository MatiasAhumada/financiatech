import { NextRequest, NextResponse } from "next/server";
import { devicesService } from "@/server/services/devices.service";
import apiErrorHandler, { ApiError } from "@/utils/handlers/apiError.handler";
import { requireRole } from "@/utils/auth.middleware";
import { createDeviceSchema } from "@/schemas/device.schema";
import httpStatus from "http-status";
import { UserRole } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const payload = requireRole(request, [UserRole.ADMIN]);
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || undefined;

    const devices = await devicesService.findByAdminId(
      payload.adminId!,
      search
    );
    return NextResponse.json(devices, { status: httpStatus.OK });
  } catch (error) {
    return apiErrorHandler({ error: error as ApiError, request });
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = requireRole(request, [UserRole.ADMIN]);
    const body = await request.json();

    const validatedData = createDeviceSchema.parse(body);

    const device = await devicesService.create({
      ...validatedData,
      admin: { connect: { id: payload.adminId! } },
      client: { connect: { id: body.clientId } },
    });

    return NextResponse.json(device, { status: httpStatus.CREATED });
  } catch (error) {
    return apiErrorHandler({ error: error as ApiError, request });
  }
}
