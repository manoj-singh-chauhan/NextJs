import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("auth_token");

  const path = request.nextUrl.pathname;
  const isAuthRoute = path.startsWith("/auth");

  if (!token && !isAuthRoute) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  if (token && isAuthRoute) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|api).*)"],
};
