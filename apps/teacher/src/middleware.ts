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

  // Handle authentication
  if (!accessToken && !isPublicRoute) {
    // If no token and trying to access protected route, redirect to login
    const url = new URL("/login", request.url);
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // If token exists, do basic validation only - let backend handle detailed checks
  if (accessToken && !isPublicRoute) {
    try {
      const payload = jwtDecode<TokenPayload>(accessToken);

      // Log the token payload for debugging
      if (process.env.NODE_ENV !== "production") {
        console.log("Token payload:", {
          userId: payload.userId,
          role: payload.role,
          exp: new Date(payload.exp * 1000).toISOString(),
          isExpired: payload.exp * 1000 < Date.now(),
        });
      }

      // Only check role, NOT expiry - let axios interceptor handle refresh
      // Verify that the user has the TEACHER role
      if (payload.role !== "TEACHER" && payload.role !== "ADMIN") {
        console.error(
          "Access denied: User does not have TEACHER or ADMIN role"
        );
        const url = new URL("/login", request.url);
        url.searchParams.set("error", "unauthorized");

        // Clear invalid tokens to prevent loops
        const response = NextResponse.redirect(url);
        response.cookies.delete("accessToken");
        response.cookies.delete("refreshToken");

        return response;
      }
    } catch (error) {
      // If token is malformed (not just expired), redirect to login
      console.error("Token decode error:", error);
      const url = new URL("/login", request.url);
      url.searchParams.set("error", "invalid");

      // Clear invalid tokens
      const response = NextResponse.redirect(url);
      response.cookies.delete("accessToken");
      response.cookies.delete("refreshToken");

      return response;
    }
  }

  // Special handling for login page when already authenticated
  if (accessToken && pathname === "/login") {
    try {
      const payload = jwtDecode<TokenPayload>(accessToken);

      // If user is not a teacher but has a token, redirect to login with unauthorized error
      if (payload.role !== "TEACHER" && payload.role !== "ADMIN") {
        console.error("Access denied: User does not have TEACHER role");
        const url = new URL("/login", request.url);
        url.searchParams.set("error", "student_access");

        // Clear tokens for non-teachers
        const response = NextResponse.redirect(url);
        response.cookies.delete("accessToken");
        response.cookies.delete("refreshToken");

        return response;
      }

      // If token exists, is valid, and has correct role, redirect to dashboard
      return NextResponse.redirect(new URL("/dashboard", request.url));
    } catch (error) {
      // For invalid tokens on login page, just proceed to login
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
