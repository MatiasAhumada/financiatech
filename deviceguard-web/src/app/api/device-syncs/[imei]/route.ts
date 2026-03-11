import { NextRequest, NextResponse } from "next/server";
import { deviceActivationService } from "@/server/services/deviceActivation.service";
import apiErrorHandler, { ApiError } from "@/utils/handlers/apiError.handler";
import httpStatus from "http-status";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const cacheHeaders = {
  ...corsHeaders,
  'Cache-Control': 'private, max-age=20, stale-while-revalidate=5',
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ imei: string }> }
) {
  try {
    const { imei } = await params;

    const status = await deviceActivationService.checkStatus(imei);

    return NextResponse.json(status, {
      status: httpStatus.OK,
      headers: cacheHeaders,
    });
  } catch (error) {
    return apiErrorHandler({ error: error as ApiError, request });
  }
}

export async function OPTIONS() {
  return NextResponse.json(null, {
    status: 204,
    headers: corsHeaders,
  });
}
