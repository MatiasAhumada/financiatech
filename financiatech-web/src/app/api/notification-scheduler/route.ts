import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/utils/auth.middleware";
import { UserRole } from "@prisma/client";
import httpStatus from "http-status";
import apiErrorHandler, { ApiError } from "@/utils/handlers/apiError.handler";
import { notificationSchedulerService } from "@/server/services/notificationScheduler.service";

/**
 * POST /api/notification-scheduler/run
 * Ejecuta manualmente el scheduler de notificaciones y bloqueos automáticos
 * 
 * Body opcional:
 * {
 *   "instance": "warning1" | "warning2" | "block_warning" | "block" | "all"
 * }
 * 
 * Si no se especifica instance, ejecuta todas las instancias
 */
export async function POST(request: NextRequest) {
  try {
    requireRole(request, [UserRole.ADMIN]);

    const body = await request.json().catch(() => ({}));
    const instance = body.instance || "all";

    let results;

    switch (instance) {
      case "warning1":
        results = {
          warning1: await notificationSchedulerService.processWarning1(),
        };
        break;
      case "warning2":
        results = {
          warning2: await notificationSchedulerService.processWarning2(),
        };
        break;
      case "block_warning":
        results = {
          blockWarning:
            await notificationSchedulerService.processBlockWarning(),
        };
        break;
      case "block":
        results = {
          block: await notificationSchedulerService.processBlockDay(),
        };
        break;
      case "all":
      default:
        results = await notificationSchedulerService.runFullScheduler();
        break;
    }

    const summary = {
      warning1: results.warning1?.length || 0,
      warning2: results.warning2?.length || 0,
      blockWarning: results.blockWarning?.length || 0,
      block: results.block?.length || 0,
      total:
        (results.warning1?.length || 0) +
        (results.warning2?.length || 0) +
        (results.blockWarning?.length || 0) +
        (results.block?.length || 0),
    };

    return NextResponse.json(
      {
        success: true,
        instance,
        summary,
        results,
      },
      { status: httpStatus.OK }
    );
  } catch (error) {
    return apiErrorHandler({ error: error as ApiError, request });
  }
}

/**
 * GET /api/notification-scheduler/run
 * Ejecuta el scheduler con query param opcional ?instance=warning1|warning2|block_warning|block|all
 */
export async function GET(request: NextRequest) {
  try {
    requireRole(request, [UserRole.ADMIN]);

    const searchParams = request.nextUrl.searchParams;
    const instance = searchParams.get("instance") || "all";

    let results;

    switch (instance) {
      case "warning1":
        results = {
          warning1: await notificationSchedulerService.processWarning1(),
        };
        break;
      case "warning2":
        results = {
          warning2: await notificationSchedulerService.processWarning2(),
        };
        break;
      case "block_warning":
        results = {
          blockWarning:
            await notificationSchedulerService.processBlockWarning(),
        };
        break;
      case "block":
        results = {
          block: await notificationSchedulerService.processBlockDay(),
        };
        break;
      case "all":
      default:
        results = await notificationSchedulerService.runFullScheduler();
        break;
    }

    const summary = {
      warning1: results.warning1?.length || 0,
      warning2: results.warning2?.length || 0,
      blockWarning: results.blockWarning?.length || 0,
      block: results.block?.length || 0,
      total:
        (results.warning1?.length || 0) +
        (results.warning2?.length || 0) +
        (results.blockWarning?.length || 0) +
        (results.block?.length || 0),
    };

    return NextResponse.json(
      {
        success: true,
        instance,
        summary,
        results,
      },
      { status: httpStatus.OK }
    );
  } catch (error) {
    return apiErrorHandler({ error: error as ApiError, request });
  }
}
