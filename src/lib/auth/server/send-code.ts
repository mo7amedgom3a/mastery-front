import "server-only";

import type { NextRequest, NextResponse } from "next/server";

import { login } from "@/lib/api/auth";
import type { CodeSentResponse } from "@/lib/auth/contract";

import { sealChallenge, type LoginChallenge } from "./challenge";
import { setChallengeCookie } from "./cookies";
import { backendOptions } from "./forward";
import { authError, authJson, backendFailure, emailRejected, isBackendStatus } from "./respond";

export const RESEND_COOLDOWN_SECONDS = 60;

/**
 * Has the backend email a sign-in code for `loginName` and leaves the pending sign-in in a sealed
 * cookie. `pending` is the sign-in already waiting for this login name, if any: a new code isn't
 * sent until its cooldown has passed.
 */
export async function sendCode(request: NextRequest, loginName: string, pending: LoginChallenge | null): Promise<NextResponse> {
  if (pending) {
    const wait = RESEND_COOLDOWN_SECONDS - Math.floor((Date.now() - pending.sentAt) / 1000);
    if (wait > 0) {
      return authError(429, "rate_limited", "أرسلنا رمزاً قبل لحظات. انتظر قليلاً قبل طلب رمز جديد.", wait);
    }
  }

  let account: LoginChallenge["account"] = null;
  try {
    const challenge = await login({ loginName }, backendOptions(request));
    account = { email: challenge.email, userId: challenge.userId };
  } catch (error) {
    const rejected = emailRejected(error);
    if (rejected) return rejected;
    // 401: no such account. Answered like a success; the code step then simply never matches.
    if (!isBackendStatus(error, 401)) return backendFailure("login", error);
  }

  let sealed: string;
  try {
    sealed = await sealChallenge({ loginName, account, sentAt: Date.now() });
  } catch (error) {
    console.error("[auth] challenge could not be sealed", error);
    return authError(503, "unavailable", "تسجيل الدخول غير متاح حالياً. حاول مجدداً بعد قليل.");
  }
  const response = authJson({ sent: true, resendAfter: RESEND_COOLDOWN_SECONDS } satisfies CodeSentResponse);
  setChallengeCookie(response, sealed);
  return response;
}
