import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Therapist routes require THERAPIST role
    if (pathname.startsWith("/therapist")) {
      if (token?.role !== "THERAPIST" && token?.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/login", req.url));
      }
    }

    // Admin routes require ADMIN role
    if (pathname.startsWith("/admin")) {
      if (token?.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/login", req.url));
      }
    }

    // User dashboard routes require authentication (any role)
    if (pathname.startsWith("/user")) {
      if (!token) {
        return NextResponse.redirect(new URL("/login", req.url));
      }
    }

    const response = NextResponse.next();
    response.headers.set("X-Request-Start", Date.now().toString());
    return response;
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Public routes — always allow
        if (
          pathname === "/" ||
          pathname.startsWith("/therapists") ||
          pathname.startsWith("/login") ||
          pathname.startsWith("/register") ||
          pathname.startsWith("/api/auth")
        ) {
          return true;
        }

        // All other matched routes require a token
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    "/therapist/:path*",
    "/user/:path*",
    "/admin/:path*",
    "/login",
    "/register",
  ],
};
