import type { NextRequest } from "next/server";

import { verifySchema } from "@/features/auth/model/schemas";
import { verifyTwoFactor, type AuthResponse } from "@/lib/api/auth";
import type { CustomerResponse } from "@/lib/auth/contract";
import { CHALLENGE_COOKIE } from "@/lib/auth/cookie-names";
import { openChallenge } from "@/lib/auth/server/challenge";
import { clearChallengeCookie, setSessionCookies } from "@/lib/auth/server/cookies";
import { backendOptions } from "@/lib/auth/server/forward";
import { rejectCrossOrigin } from "@/lib/auth/server/guard";
import { authError, authJson, backendFailure, isBackendStatus, readAuthBody } from "@/lib/auth/server/respond";

/** One answer for every way the code step can fail: wrong code, expired attempt, unknown account. */
const invalidCode = () => authError(401, "invalid_code", "رمز التحقق غير صحيح أو انتهت صلاحيته.");

/**
 * Step two of signing in: the emailed code. On success the session starts: the tokens go into
 * httpOnly cookies and only the customer's profile is returned to the page.
 */
export async function POST(request: NextRequest) {
  const denied = rejectCrossOrigin(request);
  if (denied) return denied;
  const body = await readAuthBody(request, verifySchema);
  if ("error" in body) return body.error;

  const pending = await openChallenge(request.cookies.get(CHALLENGE_COOKIE)?.value);
  if (!pending?.account) return invalidCode();

  let result: AuthResponse;
  try {
    result = await verifyTwoFactor({ ...pending.account, code: body.data.code }, backendOptions(request));
  } catch (error) {
    if (isBackendStatus(error, 401) || isBackendStatus(error, 422)) return invalidCode();
    return backendFailure("verify", error);
  }

  const response = authJson({ customer: result.customer } satisfies CustomerResponse);
  setSessionCookies(response, result.tokens);
  clearChallengeCookie(response);
  return response;
}
