import { NextRequest, NextResponse } from "next/server";

// Public routes that don't require authentication
const publicRoutes = ["/", "/login", "/register", "/api/auth"];

// Protected routes that require authentication
const protectedRoutes = ["/dashboard", "/create", "/result", "/admin"];

// Routes that should redirect to dashboard if already logged in
const authRoutes = ["/login", "/register"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get session token from cookie
  const sessionToken = request.cookies.get("session")?.value;
  const isLoggedIn = !!sessionToken;

  // Check if the route is public
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname.startsWith(route)
  );

  // Check if the route is auth-only (login/register)
  const isAuthRoute = authRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  // If not logged in and trying to access protected route
  if (!isLoggedIn && isProtectedRoute) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If logged in and trying to access auth routes (login/register)
  if (isLoggedIn && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all routes except static files and Next.js internals
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
