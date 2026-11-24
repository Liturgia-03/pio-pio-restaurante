import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "asadero-default-secret-key-change-me";
const key = new TextEncoder().encode(JWT_SECRET);
const COOKIE_NAME = "asadero_admin_token";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;

  let isValid = false;
  let userRole: string | null = null;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, key);
      isValid = true;
      userRole = (payload.role as string) || null;
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
      url.pathname = userRole === "SUPER_ADMIN" ? "/admin/owner" : "/admin/dashboard";
      return NextResponse.redirect(url);
    }

    // Separación estricta de rutas por rol
    if (isValid) {
      // 1. Si es SUPER_ADMIN: únicamente tiene acceso a /admin/owner, /admin/caja y /admin/settings.
      // Si intenta ingresar a /admin/dashboard o a rutas operativas, redirigir de inmediato al panel del dueño
      if (userRole === "SUPER_ADMIN") {
        const allowedOwnerPaths = ["/admin/owner", "/admin/caja", "/admin/settings"];
        const isAllowed = allowedOwnerPaths.some(
          (p) => pathname === p || pathname.startsWith(p + "/")
        );
        if (!isAllowed) {
          const url = request.nextUrl.clone();
          url.pathname = "/admin/owner";
          return NextResponse.redirect(url);
        }
      }

      // 2. Si es ADMIN operativo (caja): no puede ingresar a /admin/owner
      if (userRole === "ADMIN" && pathname.startsWith("/admin/owner")) {
        const url = request.nextUrl.clone();
        url.pathname = "/admin/dashboard";
        return NextResponse.redirect(url);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
