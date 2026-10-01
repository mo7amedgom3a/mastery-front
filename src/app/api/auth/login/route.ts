import type { NextRequest } from "next/server";

import { loginSchema } from "@/features/auth/model/schemas";
import { CHALLENGE_COOKIE } from "@/lib/auth/cookie-names";
import { openChallenge } from "@/lib/auth/server/challenge";
import { rejectCrossOrigin } from "@/lib/auth/server/guard";
import { readAuthBody } from "@/lib/auth/server/respond";
import { sendCode } from "@/lib/auth/server/send-code";

/**
 * Step one of signing in: asks for a code to be emailed. The answer is the same whether or not
 * the account exists, so this can't be used to find out which emails are registered.
 */
export async function POST(request: NextRequest) {
  const denied = rejectCrossOrigin(request);
  if (denied) return denied;
  const body = await readAuthBody(request, loginSchema);
  if ("error" in body) return body.error;

  // Submitting the same email again within the cooldown is a resend, and waits like one.
  const pending = await openChallenge(request.cookies.get(CHALLENGE_COOKIE)?.value);
  const samePending = pending?.loginName === body.data.loginName ? pending : null;
  return sendCode(request, body.data.loginName, samePending);
}
