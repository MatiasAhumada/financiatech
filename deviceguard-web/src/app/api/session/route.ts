import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/server/services/auth.service";
import apiErrorHandler, { ApiError } from "@/utils/handlers/apiError.handler";
import { AUTH_CONSTANTS } from "@/constants/auth.constant";
import { getTokenFromRequest } from "@/utils/auth.middleware";
import httpStatus from "http-status";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user, token } = await authService.login(body);

    const response = NextResponse.json(
      { user, token },
      { status: httpStatus.OK }
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

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    const user = await authService.verifyToken(token);

    return NextResponse.json({ user }, { status: httpStatus.OK });
  } catch (error) {
    return apiErrorHandler({ error: error as ApiError, request });
  }
}

export async function DELETE(request: NextRequest) {
  const response = NextResponse.json(
    { message: "Logout successful" },
    { status: httpStatus.OK }
  );

  response.cookies.delete(AUTH_CONSTANTS.TOKEN_COOKIE_NAME);

  return response;
}
