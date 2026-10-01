import { NextResponse, type NextRequest } from "next/server";

import { safeNextPath } from "@/features/auth/model/next-path";
import { SESSION_COOKIE } from "@/lib/auth/cookie-names";

const AUTH_PAGES = new Set(["/login", "/register"]);

/**
 * Routing by whether a session may exist: account pages send a guest to sign in, and the auth
 * pages send a signed-in visitor on. It only looks at a cookie's presence, which says nothing
 * about the session being valid: the backend checks the token on every call that needs one.
 */
export function proxy(request: NextRequest) {
  const hasSession = request.cookies.has(SESSION_COOKIE);
  const { pathname, search, searchParams } = request.nextUrl;

  if (AUTH_PAGES.has(pathname)) {
    if (!hasSession) return NextResponse.next();
    return NextResponse.redirect(new URL(safeNextPath(searchParams.get("next") ?? undefined), request.url));
  }

  if (hasSession) return NextResponse.next();

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/students/:path*", "/login", "/register"],
};
