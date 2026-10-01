import type { NextRequest } from "next/server";

import { CHALLENGE_COOKIE } from "@/lib/auth/cookie-names";
import { openChallenge } from "@/lib/auth/server/challenge";
import { rejectCrossOrigin } from "@/lib/auth/server/guard";
import { authError } from "@/lib/auth/server/respond";
import { sendCode } from "@/lib/auth/server/send-code";

/** Emails a new code for the sign-in already in progress, once its cooldown has passed. */
export async function POST(request: NextRequest) {
  const denied = rejectCrossOrigin(request);
  if (denied) return denied;

  const pending = await openChallenge(request.cookies.get(CHALLENGE_COOKIE)?.value);
  if (!pending) {
    return authError(401, "invalid_code", "انتهت صلاحية محاولة الدخول. أدخل بريدك الإلكتروني من جديد.");
  }
  return sendCode(request, pending.loginName, pending);
}
