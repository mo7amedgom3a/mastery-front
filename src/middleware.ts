import { NextResponse, type NextRequest } from "next/server";

const ACCESS_COOKIE = "b2c_access_token";
const REFRESH_COOKIE = "b2c_refresh_token";

export function middleware(request: NextRequest) {
  const hasAccessToken = request.cookies.has(ACCESS_COOKIE);
  const hasRefreshToken = request.cookies.has(REFRESH_COOKIE);

  if (hasAccessToken || hasRefreshToken) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/students/:path*"],
};
