import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import apiErrorHandler, { ApiError } from "@/utils/handlers/apiError.handler";
import httpStatus from "http-status";
import { z } from "zod";

const ackSchema = z.object({
  deviceId: z.string(),
  type: z.enum(["DEVICE_BLOCKED", "DEVICE_UNBLOCKED"]),
  timestamp: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = ackSchema.parse(body);

    const { deviceId, type, timestamp } = validatedData;

    await prisma.deviceSync.update({
      where: { deviceId },
      data: {
        syncedAt: new Date(timestamp),
      },
    });

    await prisma.pendingCommand.create({
      data: {
        deviceId,
        type,
        status: "ACKED",
        ackedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "ACK received",
    });
  } catch (error) {
    return apiErrorHandler({ error: error as ApiError, request });
  }
}
