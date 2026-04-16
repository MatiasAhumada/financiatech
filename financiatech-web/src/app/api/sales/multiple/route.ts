import { NextRequest, NextResponse } from "next/server";
import { saleService } from "@/server/services/sale.service";
import apiErrorHandler, { ApiError } from "@/utils/handlers/apiError.handler";
import { requireRole, verifyAuth } from "@/utils/auth.middleware";
import { createMultipleSaleSchema } from "@/schemas/sale.schema";
import httpStatus from "http-status";
import { UserRole } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    requireRole(request, [UserRole.ADMIN]);
    const body = await request.json();

    const validatedData = createMultipleSaleSchema.parse(body);

    const sale = await saleService.createMultiple(validatedData);

    return NextResponse.json(sale, { status: httpStatus.CREATED });
  } catch (error) {
    return apiErrorHandler({ error: error as ApiError, request });
  }
}
