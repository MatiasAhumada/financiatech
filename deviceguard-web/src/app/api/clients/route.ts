import { NextRequest, NextResponse } from "next/server";
import { clientService } from "@/server/services/client.service";
import apiErrorHandler, { ApiError } from "@/utils/handlers/apiError.handler";
import { requireRole } from "@/utils/auth.middleware";
import { createClientSchema } from "@/schemas/client.schema";
import httpStatus from "http-status";
import { UserRole } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const payload = requireRole(request, [UserRole.ADMIN]);
    const body = await request.json();

    const validatedData = createClientSchema.parse(body);

    const client = await clientService.create({
      ...validatedData,
      adminId: payload.adminId!,
    });

    return NextResponse.json(client, { status: httpStatus.CREATED });
  } catch (error) {
    return apiErrorHandler({ error: error as ApiError, request });
  }
}

export async function GET(request: NextRequest) {
  try {
    const payload = requireRole(request, [UserRole.ADMIN]);
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || undefined;

    const clients = await clientService.findByAdminId(payload.adminId!, search);

    return NextResponse.json(clients, { status: httpStatus.OK });
  } catch (error) {
    return apiErrorHandler({ error: error as ApiError, request });
  }
}
