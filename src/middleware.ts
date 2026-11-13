import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "asadero-default-secret-key-change-me";
const key = new TextEncoder().encode(JWT_SECRET);
const COOKIE_NAME = "asadero_admin_token";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;

  let isValid = false;
  if (token) {
    try {
      await jwtVerify(token, key);
      isValid = true;
    } catch {
      isValid = false;
    }
  }

  // Rutas de API protegidas
  if (pathname.startsWith("/api/admin")) {
    if (pathname === "/api/admin/auth/login") {
      return NextResponse.next();
    }
    if (!isValid) {
      return NextResponse.json(
        { success: false, data: null, message: "No autorizado. Token inválido o ausente." },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  // Rutas de páginas administrativas
  if (pathname.startsWith("/admin")) {
    const isLoginPage = pathname === "/admin/login";

    if (!isValid && !isLoginPage) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }

    if (isValid && isLoginPage) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
