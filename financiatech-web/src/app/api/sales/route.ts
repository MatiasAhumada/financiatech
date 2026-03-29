import { NextRequest, NextResponse } from "next/server";
import { saleService } from "@/server/services/sale.service";
import apiErrorHandler, { ApiError } from "@/utils/handlers/apiError.handler";
import { requireRole, verifyAuth } from "@/utils/auth.middleware";
import { createSaleSchema } from "@/schemas/sale.schema";
import httpStatus from "http-status";
import { UserRole } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const payload = verifyAuth(request);
    const search = request.nextUrl.searchParams.get("search") || undefined;
    const isStats = request.nextUrl.searchParams.get("stats") === "true";

    if (isStats) {
      const stats = await saleService.getStats(payload.adminId!);
      return NextResponse.json(stats, { status: httpStatus.OK });
    }

    const sales = await saleService.findByAdminId(payload.adminId!, search);

    return NextResponse.json(sales, { status: httpStatus.OK });
  } catch (error) {
    return apiErrorHandler({ error: error as ApiError, request });
  }
}

export async function POST(request: NextRequest) {
  try {
    requireRole(request, [UserRole.ADMIN]);
    const body = await request.json();

    const validatedData = createSaleSchema.parse(body);

    const sale = await saleService.create(validatedData);

    return NextResponse.json(sale, { status: httpStatus.CREATED });
  } catch (error) {
    return apiErrorHandler({ error: error as ApiError, request });
  }
}
