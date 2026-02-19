import { NextRequest, NextResponse } from "next/server";
import { financingPlanService } from "@/server/services/financingPlan.service";
import apiErrorHandler, { ApiError } from "@/utils/handlers/apiError.handler";
import { requireRole } from "@/utils/auth.middleware";
import { createFinancingPlanSchema } from "@/schemas/financingPlan.schema";
import httpStatus from "http-status";
import { UserRole } from "@prisma/client";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    requireRole(request, [UserRole.ADMIN]);
    const body = await request.json();
    const { id } = await params;

    const validatedData = createFinancingPlanSchema.parse(body);

    const plan = await financingPlanService.update(id, validatedData);

    return NextResponse.json(plan, { status: httpStatus.OK });
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

    await financingPlanService.delete(id);

    return NextResponse.json(
      { message: "Plan eliminado" },
      { status: httpStatus.OK }
    );
  } catch (error) {
    return apiErrorHandler({ error: error as ApiError, request });
  }
}
