import { NextResponse, type NextRequest } from "next/server";

import { logout } from "@/lib/api/auth";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/auth/cookie-names";
import { clearChallengeCookie, clearSessionCookies } from "@/lib/auth/server/cookies";
import { backendOptions } from "@/lib/auth/server/forward";
import { rejectCrossOrigin } from "@/lib/auth/server/guard";

/** Ends the session on the backend and removes every auth cookie from this browser. */
export async function POST(request: NextRequest) {
  const denied = rejectCrossOrigin(request);
  if (denied) return denied;

  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  if (accessToken || refreshToken) {
    try {
      await logout({ refresh_token: refreshToken ?? null }, backendOptions(request, accessToken));
    } catch (error) {
      // The browser is signed out regardless; the backend session then runs out on its own.
      console.error("[auth] logout failed", error);
    }
  }

  const response = new NextResponse(null, { status: 204, headers: { "Cache-Control": "private, no-store" } });
  clearSessionCookies(response);
  clearChallengeCookie(response);
  return response;
}
