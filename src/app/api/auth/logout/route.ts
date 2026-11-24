import { NextResponse, type NextRequest } from "next/server";

import { logout } from "@/lib/api/auth";
import type { SignOutResult } from "@/lib/auth/client";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/auth/cookie-names";
import { clearChallengeCookie, clearSessionCookies } from "@/lib/auth/server/cookies";
import { backendOptions } from "@/lib/auth/server/forward";
import { rejectCrossOrigin } from "@/lib/auth/server/guard";
import { browserLmsRefreshToken, clearLmsCookie, lmsLogoutUrl, onSharedDomain } from "@/lib/auth/server/lms";

/**
 * Ends the session on the backend and removes every auth cookie from this browser, including the
 * LMS session cookie shared with the LMS (its legacy chain is ended on the legacy API as well).
 */
export async function POST(request: NextRequest) {
  const denied = rejectCrossOrigin(request);
  if (denied) return denied;

  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  const shared = onSharedDomain(request);
  const legacyRefreshToken = shared ? browserLmsRefreshToken(request) : null;
  if (accessToken || refreshToken || legacyRefreshToken) {
    try {
      await logout(
        { refresh_token: refreshToken ?? null, legacy_refresh_token: legacyRefreshToken },
        backendOptions(request, accessToken),
      );
    } catch (error) {
      // The browser is signed out regardless; the backend session then runs out on its own.
      console.error("[auth] logout failed", error);
    }
  }

  const response = NextResponse.json({ lmsLogoutUrl: lmsLogoutUrl(request) } satisfies SignOutResult, {
    headers: { "Cache-Control": "private, no-store" },
  });
  clearSessionCookies(response);
  clearChallengeCookie(response);
  if (shared) clearLmsCookie(response);
  return response;
}
