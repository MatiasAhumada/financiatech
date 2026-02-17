import { NextRequest, NextResponse } from "next/server";
import { clientService } from "@/server/services/client.service";
import apiErrorHandler, { ApiError } from "@/utils/handlers/apiError.handler";
import { requireRole } from "@/utils/auth.middleware";
import { createClientSchema } from "@/schemas/client.schema";
import httpStatus from "http-status";
import { UserRole } from "@prisma/client";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = requireRole(request, [UserRole.ADMIN]);
    const body = await request.json();
    const { id } = await params;

    const validatedData = createClientSchema.parse(body);

    const client = await clientService.update(id, validatedData);

    return NextResponse.json(client, { status: httpStatus.OK });
  } catch (error) {
    return apiErrorHandler({ error: error as ApiError, request });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    requireRole(request, [UserRole.ADMIN]);
    const { id } = await params;

    await clientService.delete(id);

    return NextResponse.json(
      { message: "Cliente eliminado" },
      { status: httpStatus.OK }
    );
  } catch (error) {
    return apiErrorHandler({ error: error as ApiError, request });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    requireRole(request, [UserRole.ADMIN]);
    const { id } = await params;

    await clientService.restore(id);

    return NextResponse.json(
      { message: "Cliente restaurado" },
      { status: httpStatus.OK }
    );
  } catch (error) {
    return apiErrorHandler({ error: error as ApiError, request });
  }
}
