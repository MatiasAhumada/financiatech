import { NextRequest, NextResponse } from "next/server";
import { financingPlanService } from "@/server/services/financingPlan.service";
import apiErrorHandler, { ApiError } from "@/utils/handlers/apiError.handler";
import { requireRole } from "@/utils/auth.middleware";
import { createFinancingPlanSchema } from "@/schemas/financingPlan.schema";
import httpStatus from "http-status";
import { UserRole } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const payload = requireRole(request, [UserRole.ADMIN]);

    const plans = await financingPlanService.findByAdminId(payload.adminId!);

    return NextResponse.json(plans, { status: httpStatus.OK });
  } catch (error) {
    return apiErrorHandler({ error: error as ApiError, request });
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = requireRole(request, [UserRole.ADMIN]);
    const body = await request.json();

    const validatedData = createFinancingPlanSchema.parse(body);

    const plan = await financingPlanService.create({
      ...validatedData,
      adminId: payload.adminId!,
    });

    return NextResponse.json(plan, { status: httpStatus.CREATED });
  } catch (error) {
    return apiErrorHandler({ error: error as ApiError, request });
  }
}
