import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/server/services/auth.service";
import apiErrorHandler, { ApiError } from "@/utils/handlers/apiError.handler";
import { AUTH_CONSTANTS } from "@/constants/auth.constant";
import httpStatus from "http-status";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user, token } = await authService.register(body);

    const response = NextResponse.json(
      { user, token },
      { status: httpStatus.CREATED }
    );

    response.cookies.set(AUTH_CONSTANTS.TOKEN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    return apiErrorHandler({ error: error as ApiError, request });
  }
}
