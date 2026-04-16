import { NextRequest, NextResponse } from "next/server";
import { saleService } from "@/server/services/sale.service";
import apiErrorHandler, { ApiError } from "@/utils/handlers/apiError.handler";
import { requireRole, verifyAuth } from "@/utils/auth.middleware";
import { createMultipleSaleSchema } from "@/schemas/sale.schema";
import httpStatus from "http-status";
import { UserRole } from "@prisma/client";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    requireRole(request, [UserRole.ADMIN]);
    const { id: saleId } = await params;
    const body = await request.json();

    const validatedData = createMultipleSaleSchema.parse(body);

    const sale = await saleService.updateMultiple(saleId, validatedData);

    return NextResponse.json(sale, { status: httpStatus.OK });
  } catch (error) {
    return apiErrorHandler({ error: error as ApiError, request });
  }
}
