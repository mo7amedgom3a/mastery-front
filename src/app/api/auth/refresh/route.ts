import type { NextRequest } from "next/server";

import { refreshSession, type AuthResponse } from "@/lib/api/auth";
import type { CustomerResponse } from "@/lib/auth/contract";
import { REFRESH_COOKIE } from "@/lib/auth/cookie-names";
import { clearSessionCookies, setSessionCookies } from "@/lib/auth/server/cookies";
import { backendOptions } from "@/lib/auth/server/forward";
import { rejectCrossOrigin } from "@/lib/auth/server/guard";
import { authError, authJson, backendFailure, isBackendStatus } from "@/lib/auth/server/respond";

function signedOut() {
  const response = authError(401, "unauthenticated", "انتهت الجلسة. سجّل الدخول من جديد.");
  clearSessionCookies(response);
  return response;
}

/**
 * Trades the refresh token for a new access token. The backend rotates the refresh token on every
 * use, so both cookies are replaced; a refresh token it no longer accepts ends the session here too.
 */
export async function POST(request: NextRequest) {
  const denied = rejectCrossOrigin(request);
  if (denied) return denied;

  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  if (!refreshToken) return signedOut();

  let result: AuthResponse;
  try {
    result = await refreshSession({ refresh_token: refreshToken }, backendOptions(request));
  } catch (error) {
    if (isBackendStatus(error, 401)) return signedOut();
    // The backend couldn't answer: the session may still be good, so the cookies stay.
    return backendFailure("refresh", error);
  }

  const response = authJson({ customer: result.customer } satisfies CustomerResponse);
  setSessionCookies(response, result.tokens);
  return response;
}
