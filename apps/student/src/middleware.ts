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
  // Check for token in cookies
  const accessToken = request.cookies.get("accessToken")?.value;
  const { pathname } = request.nextUrl;

  // Handle public routes
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  // For debugging
  if (process.env.NODE_ENV !== "production") {
    console.log(
      `Path: ${pathname}, Token: ${
        accessToken ? "exists" : "missing"
      }, Public: ${isPublicRoute}`
    );
  }

  // Handle authentication - redirect to login if no token on protected route
  if (!accessToken && !isPublicRoute) {
    const url = new URL("/login", request.url);
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // If token exists and not on public route, validate role only (not expiry)
  if (accessToken && !isPublicRoute) {
    try {
      const payload = jwtDecode<TokenPayload>(accessToken);

      // Log for debugging
      if (process.env.NODE_ENV !== "production") {
        console.log("Token payload:", {
          userId: payload.userId,
          role: payload.role,
          exp: new Date(payload.exp * 1000).toISOString(),
          isExpired: payload.exp * 1000 < Date.now(),
        });
      }

      // Only verify role, not expiry - axios interceptor handles refresh
      if (payload.role !== "STUDENT") {
        console.error("Access denied: User does not have STUDENT role");
        const url = new URL("/login", request.url);
        url.searchParams.set("error", "unauthorized");

        const response = NextResponse.redirect(url);
        response.cookies.delete("accessToken");
        response.cookies.delete("refreshToken");
        return response;
      }
    } catch (error) {
      // Malformed token - redirect to login
      console.error("Token decode error:", error);
      const url = new URL("/login", request.url);
      url.searchParams.set("error", "invalid");

      const response = NextResponse.redirect(url);
      response.cookies.delete("accessToken");
      response.cookies.delete("refreshToken");
      return response;
    }
  }

  // Redirect authenticated users away from login page
  if (accessToken && pathname === "/login") {
    try {
      const payload = jwtDecode<TokenPayload>(accessToken);

      // Verify role before redirecting
      if (payload.role === "STUDENT") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      } else {
        // Wrong app for this user type
        const response = NextResponse.redirect(new URL("/login", request.url));
        response.cookies.delete("accessToken");
        response.cookies.delete("refreshToken");
        return response;
      }
    } catch (error) {
      // Invalid token, stay on login
      const response = NextResponse.next();
      response.cookies.delete("accessToken");
      response.cookies.delete("refreshToken");
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg).*)"],
};
