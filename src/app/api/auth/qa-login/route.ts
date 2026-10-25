import type { NextRequest } from "next/server";

import { isQaLoginEnabled } from "@/config/env";
import { qaLoginSchema } from "@/features/auth/model/schemas";
import { qaLogin, type AuthResponse } from "@/lib/api/auth";
import type { CustomerResponse } from "@/lib/auth/contract";
import { clearChallengeCookie, setSessionCookies } from "@/lib/auth/server/cookies";
import { backendOptions } from "@/lib/auth/server/forward";
import { rejectCrossOrigin } from "@/lib/auth/server/guard";
import { authError, authJson, backendFailure, isBackendStatus, readAuthBody } from "@/lib/auth/server/respond";

const invalidCredentials = () => authError(401, "invalid_code", "البريد الإلكتروني أو مفتاح QA غير صحيح.");

/**
 * Development-only sign-in for the QA accounts (customer or expert) with the shared QA key, skipping
 * the emailed code. Starts the session exactly like `/api/auth/verify` does.
 */
export async function POST(request: NextRequest) {
  if (!isQaLoginEnabled()) return authError(404, "forbidden", "غير متاح.");
  const denied = rejectCrossOrigin(request);
  if (denied) return denied;
  const body = await readAuthBody(request, qaLoginSchema);
  if ("error" in body) return body.error;

  let result: AuthResponse;
  try {
    result = await qaLogin(body.data, backendOptions(request));
  } catch (error) {
    // 404: QA login is off on the backend; answered the same as a wrong key.
    if ([401, 403, 404, 422].some((status) => isBackendStatus(error, status))) return invalidCredentials();
    return backendFailure("qa-login", error);
  }

  const response = authJson({ customer: result.customer } satisfies CustomerResponse);
  setSessionCookies(response, result.tokens);
  clearChallengeCookie(response);
  return response;
}
