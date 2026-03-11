import { NextRequest, NextResponse } from "next/server";
import { jwtUtils } from "@/utils/jwt.util";
import { AUTH_CONSTANTS } from "@/constants/auth.constant";
import { ROUTES } from "@/constants/routes";

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Agregar headers CORS a todas las rutas de API
  if (pathname.startsWith('/api/')) {
    // Manejar preflight requests (OPTIONS)
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // Para todas las demás peticiones de API, agregar headers CORS
    const response = NextResponse.next();
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;
  }

  // Autenticación para rutas que no son API
  if (pathname === ROUTES.LOGIN) {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_CONSTANTS.TOKEN_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.redirect(new URL(ROUTES.LOGIN, request.url));
  }

  try {
    jwtUtils.verify(token);
    return NextResponse.next();
  } catch {
    const response = NextResponse.redirect(new URL(ROUTES.LOGIN, request.url));
    response.cookies.delete(AUTH_CONSTANTS.TOKEN_COOKIE_NAME);
    return response;
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};
