import { NextResponse, type NextRequest } from "next/server";

import { getApiBaseUrl } from "@/config/env";
import { routes } from "@/config/routes";
import { logout } from "@/lib/api/auth";
import type { LmsLaunchResult } from "@/lib/api/lms";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/auth/cookie-names";
import { clearSessionCookies } from "@/lib/auth/server/cookies";
import { backendHeaders, backendOptions } from "@/lib/auth/server/forward";
import { rejectCrossOrigin } from "@/lib/auth/server/guard";
import { browserLmsRefreshToken, clearLmsCookie, onSharedDomain, setLmsCookie } from "@/lib/auth/server/lms";
import { authError } from "@/lib/auth/server/respond";

const NO_STORE = { "Cache-Control": "private, no-store" };
const BACKEND_TIMEOUT_MS = 20_000;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Where the LMS sends people back to, and so where a fresh sign-in should land. */
const AFTER_SIGN_IN = "/students/learning";

type BackendLaunch = {
  mode: "cookie" | "login";
  redirect_url?: string | null;
  refresh_token?: string | null;
  refresh_expires_at?: string | null;
};

/**
 * "Continue learning". The LMS host serves the course player only and builds its session from the
 * legacy `refreshToken` cookie on the parent domain it shares with this site. The browser's current
 * cookie goes to the backend (server to server), which rotates one chain through the legacy API and
 * returns the new token; this handler sets it as that cookie. From then on only the browser rotates
 * that chain, so the backend and the LMS never spend the same single-use token.
 *
 * When there is no usable chain the B2C session is ended too: a fresh sign-in stores a new chain.
 * Off the shared domain (localhost, previews) no cookie can reach the LMS: nothing is rotated and
 * the visitor is told so, without being signed out.
 */
export async function POST(request: NextRequest) {
  const denied = rejectCrossOrigin(request);
  if (denied) return denied;

  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  if (!accessToken) return authError(401, "unauthenticated", "سجّل الدخول للمتابعة.");

  // Either a B2C purchase or a course the LMS itself enrolled the student in (checked by the backend).
  let body: { entitlementId?: unknown; lmsCourseId?: unknown } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = {};
  }
  const entitlementId =
    typeof body.entitlementId === "string" && UUID_PATTERN.test(body.entitlementId) ? body.entitlementId : null;
  const lmsCourseId =
    typeof body.lmsCourseId === "number" && Number.isSafeInteger(body.lmsCourseId) && body.lmsCourseId > 0
      ? body.lmsCourseId
      : null;
  if (!entitlementId && !lmsCourseId) {
    return authError(400, "invalid_request", "بيانات الطلب غير صحيحة.");
  }

  if (!onSharedDomain(request)) {
    return authError(409, "unavailable", "منصة التعلّم تُفتح من الموقع الرسمي فقط (emasteryacademy.com).");
  }

  const headers = backendHeaders(request, accessToken);
  headers.set("Content-Type", "application/json");
  let upstream: Response;
  try {
    upstream = await fetch(`${getApiBaseUrl()}/me/lms/launch`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        ...(entitlementId ? { entitlement_id: entitlementId } : { lms_course_id: lmsCourseId }),
        browser_refresh_token: browserLmsRefreshToken(request),
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(BACKEND_TIMEOUT_MS),
    });
  } catch (error) {
    console.error("[lms] launch request failed", error);
    return authError(502, "unavailable", "تعذّر فتح منصة التعلّم حالياً. حاول مجدداً بعد قليل.");
  }
  if (upstream.status === 401) return authError(401, "unauthenticated", "سجّل الدخول للمتابعة.");
  if (upstream.status === 404) return authError(404, "forbidden", "لا يوجد وصول فعّال لهذا البرنامج.");
  if (upstream.status === 403) return authError(403, "forbidden", "وصولك إلى هذا البرنامج موقوف. تواصل مع الدعم.");
  if (upstream.status === 409) return authError(409, "unavailable", "نجهّز وصولك إلى منصة التعلّم، حاول بعد دقائق.");
  if (upstream.status === 503 || upstream.status === 504 || upstream.status === 429) {
    return authError(503, "unavailable", "منصة التعلّم لا تستجيب حالياً. حاول مجدداً بعد قليل.");
  }
  if (!upstream.ok) return authError(502, "unavailable", "تعذّر فتح منصة التعلّم حالياً. حاول مجدداً بعد قليل.");

  const launch = (await upstream.json()) as BackendLaunch;
  if (launch.mode !== "cookie" || !launch.redirect_url) {
    return signInAgain(request, accessToken);
  }
  const response = NextResponse.json({ mode: "cookie", redirectUrl: launch.redirect_url } satisfies LmsLaunchResult, {
    headers: NO_STORE,
  });
  // No token: a launch a moment ago (double click, second tab) already set the current cookie.
  if (launch.refresh_token) setLmsCookie(response, launch.refresh_token, launch.refresh_expires_at);
  return response;
}

/** Ends this session (and the browser's legacy chain) and sends the visitor to sign in again. */
async function signInAgain(request: NextRequest, accessToken: string): Promise<NextResponse> {
  const legacyRefreshToken = browserLmsRefreshToken(request);
  try {
    await logout(
      { refresh_token: request.cookies.get(REFRESH_COOKIE)?.value ?? null, legacy_refresh_token: legacyRefreshToken },
      backendOptions(request, accessToken),
    );
  } catch (error) {
    console.error("[lms] sign-out before re-login failed", error);
  }
  const response = NextResponse.json(
    { mode: "login", redirectUrl: routes.loginThen(AFTER_SIGN_IN) } satisfies LmsLaunchResult,
    { headers: NO_STORE },
  );
  clearSessionCookies(response);
  clearLmsCookie(response);
  return response;
}
