import { NextRequest } from "next/server";
import { jwtUtils } from "@/utils/jwt.util";
import { ApiError } from "@/utils/handlers/apiError.handler";
import { AUTH_CONSTANTS, AUTH_MESSAGES } from "@/constants/auth.constant";
import { JwtPayload } from "@/types/auth.types";
import httpStatus from "http-status";
import { UserRole } from "@prisma/client";

export function getTokenFromRequest(request: NextRequest): string {
  const authHeader = request.headers.get("authorization");

  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  const cookieToken = request.cookies.get(AUTH_CONSTANTS.TOKEN_COOKIE_NAME);
  if (cookieToken) {
    return cookieToken.value;
  }

  throw new ApiError({
    status: httpStatus.UNAUTHORIZED,
    message: AUTH_MESSAGES.UNAUTHORIZED,
  });
}

export function verifyAuth(request: NextRequest): JwtPayload {
  const token = getTokenFromRequest(request);

  try {
    return jwtUtils.verify(token);
  } catch {
    throw new ApiError({
      status: httpStatus.UNAUTHORIZED,
      message: AUTH_MESSAGES.TOKEN_INVALID,
    });
  }
}

export function requireRole(
  request: NextRequest,
  allowedRoles: UserRole[]
): JwtPayload {
  const payload = verifyAuth(request);

  if (!allowedRoles.includes(payload.role)) {
    throw new ApiError({
      status: httpStatus.FORBIDDEN,
      message: AUTH_MESSAGES.INSUFFICIENT_PERMISSIONS,
    });
  }

  return payload;
}
