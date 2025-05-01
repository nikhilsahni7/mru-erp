import { jwtDecode } from "jwt-decode";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Routes that don't require authentication
const publicRoutes = ["/login"];

// Token payload interface
interface TokenPayload {
  userId: string;
  role: string;
  exp: number;
}

export function middleware(request: NextRequest) {
  // Check for token in cookies instead of client-side localStorage
  const accessToken = request.cookies.get("accessToken")?.value;
  const { pathname } = request.nextUrl;

  // Handle public routes
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`));

  // For debugging
  console.log(`Path: ${pathname}, Token: ${accessToken ? "exists" : "missing"}, Public: ${isPublicRoute}`);

  // Handle authentication
  if (!accessToken && !isPublicRoute) {
    // If no token and trying to access protected route, redirect to login
    const url = new URL("/login", request.url);
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // If token exists, validate it has the correct role before allowing access to protected routes
  if (accessToken && !isPublicRoute) {
    try {
      const payload = jwtDecode<TokenPayload>(accessToken);

      // Verify that the token is not expired
      if (payload.exp * 1000 < Date.now()) {
        const url = new URL("/login", request.url);
        url.searchParams.set("redirect", pathname);
        url.searchParams.set("error", "expired");
        return NextResponse.redirect(url);
      }

      // Verify that the user has the TEACHER role
      if (payload.role !== "TEACHER") {
        console.error("Access denied: User does not have TEACHER role");
        const url = new URL("/login", request.url);
        url.searchParams.set("error", "unauthorized");
        return NextResponse.redirect(url);
      }
    } catch (error) {
      // If token is invalid, redirect to login
      console.error("Token validation error:", error);
      const url = new URL("/login", request.url);
      url.searchParams.set("error", "invalid");
      return NextResponse.redirect(url);
    }
  }

  if (accessToken && pathname === "/login") {
    // If token exists and trying to access login, redirect to dashboard
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg).*)"],
};
