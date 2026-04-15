import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/utils/auth.middleware";
import { UserRole } from "@prisma/client";
import httpStatus from "http-status";
import apiErrorHandler, { ApiError } from "@/utils/handlers/apiError.handler";
import { notificationSchedulerService } from "@/server/services/notificationScheduler.service";

/**
 * POST /api/devices/:id/notifications
 * Dispara manualmente una notificación de una instancia específica
 *
 * Body:
 * {
 *   "instance": "warning1" | "warning2" | "block_warning" | "block"
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = requireRole(request, [UserRole.ADMIN]);
    const { id: deviceId } = await params;
    const body = await request.json();

    const { instance } = body;

    if (
      !instance ||
      !["warning1", "warning2", "block_warning", "block"].includes(instance)
    ) {
      throw new ApiError({
        status: httpStatus.BAD_REQUEST,
        message:
          "Instancia inválida. Debe ser: warning1, warning2, block_warning o block",
      });
    }

    const result = await notificationSchedulerService.triggerManualNotification(
      deviceId,
      instance,
      payload.adminId || "system"
    );

    return NextResponse.json(
      {
        success: true,
        result,
      },
      { status: httpStatus.OK }
    );
  } catch (error) {
    return apiErrorHandler({ error: error as ApiError, request });
  }
}

/**
 * GET /api/devices/:id/notifications
 * Obtiene el historial de notificaciones de un dispositivo
 *
 * Query params opcionales:
 * - limit: número de logs a retornar (default 50)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    requireRole(request, [UserRole.ADMIN]);
    const { id: deviceId } = await params;

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "50");

    const logs = await notificationSchedulerService.getDeviceNotificationLogs(
      deviceId,
      limit
    );

    return NextResponse.json(
      {
        success: true,
        logs,
      },
      { status: httpStatus.OK }
    );
  } catch (error) {
    return apiErrorHandler({ error: error as ApiError, request });
  }
}
