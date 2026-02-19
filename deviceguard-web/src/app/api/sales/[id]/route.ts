import { NextRequest, NextResponse } from "next/server";
import { saleService } from "@/server/services/sale.service";
import apiErrorHandler, { ApiError } from "@/utils/handlers/apiError.handler";
import { verifyAuth } from "@/utils/auth.middleware";
import httpStatus from "http-status";
import { createSaleSchema } from "@/schemas/sale.schema";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    verifyAuth(request);
    const { id } = await params;

    await saleService.delete(id);

    return NextResponse.json(
      { message: "Venta eliminada exitosamente" },
      { status: httpStatus.OK }
    );
  } catch (error) {
    return apiErrorHandler({ error: error as ApiError, request });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    verifyAuth(request);
    const { id } = await params;
    const body = await request.json();

    const validatedData = createSaleSchema.parse(body);

    const sale = await saleService.update(id, validatedData);

    return NextResponse.json(sale, { status: httpStatus.OK });
  } catch (error) {
    return apiErrorHandler({ error: error as ApiError, request });
  }
}
