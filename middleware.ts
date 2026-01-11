import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Admin routes
    if (path.startsWith("/admin")) {
      if (token?.role !== "admin" && token?.role !== "manager") {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
    }

    // Designer routes
    if (path.startsWith("/designer")) {
      if (
        token?.role !== "designer" &&
        token?.role !== "manager" &&
        token?.role !== "admin"
      ) {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/designer/:path*",
    "/jobs/:path*",
    "/profile/:path*",
  ],
};
