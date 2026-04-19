import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import httpStatus from "http-status";
import apiErrorHandler, { ApiError } from "@/utils/handlers/apiError.handler";
import { deviceLocationService } from "@/server/services/deviceLocation.service";

const locationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().optional(),
  timestamp: z.string().datetime(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ serialNumber: string }> }
) {
  try {
    const { serialNumber } = await params;
    const body = await request.json();
    
    const validatedData = locationSchema.parse(body);
    
    await deviceLocationService.saveLocation(serialNumber, {
      latitude: validatedData.latitude,
      longitude: validatedData.longitude,
      accuracy: validatedData.accuracy,
      timestamp: new Date(validatedData.timestamp),
    });
    
    return NextResponse.json(
      { success: true, message: "Location saved" },
      { status: httpStatus.CREATED }
    );
  } catch (error) {
    return apiErrorHandler({ error: error as ApiError, request });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ serialNumber: string }> }
) {
  try {
    const { serialNumber } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "100");
    
    const locations = await deviceLocationService.getLocations(serialNumber, limit);
    
    return NextResponse.json(
      { success: true, locations },
      { status: httpStatus.OK }
    );
  } catch (error) {
    return apiErrorHandler({ error: error as ApiError, request });
  }
}
