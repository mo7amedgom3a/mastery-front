import type { NextRequest } from "next/server";

import { getCurrentAuthUser } from "@/lib/api/auth";
import type { SessionResponse } from "@/lib/auth/contract";
import { ACCESS_COOKIE, REFRESH_COOKIE, SESSION_COOKIE } from "@/lib/auth/cookie-names";
import { clearSessionCookies } from "@/lib/auth/server/cookies";
import { backendOptions } from "@/lib/auth/server/forward";
import { authJson, backendFailure, isBackendStatus } from "@/lib/auth/server/respond";

/**
 * Who is signed in, as the backend sees it. A visitor without a session gets a plain 200 with
 * `customer: null`: it is the normal case for most page views, not an error.
 */
export async function GET(request: NextRequest) {
  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  const refreshable = request.cookies.has(REFRESH_COOKIE);

  if (accessToken) {
    try {
      const customer = await getCurrentAuthUser(backendOptions(request, accessToken));
      return authJson({ customer } satisfies SessionResponse);
    } catch (error) {
      if (!isBackendStatus(error, 401)) return backendFailure("session", error);
    }
  }

  const response = authJson({ customer: null, refreshable } satisfies SessionResponse);
  // Nothing left to restore the session with: drop what remains, including the presence hint.
  if (!refreshable && (accessToken || request.cookies.has(SESSION_COOKIE))) clearSessionCookies(response);
  return response;
}
