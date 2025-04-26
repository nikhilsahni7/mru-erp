import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Routes that don't require authentication
const publicRoutes = ["/login"];

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

  if (accessToken && pathname === "/login") {
    // If token exists and trying to access login, redirect to dashboard
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg).*)"],
};
