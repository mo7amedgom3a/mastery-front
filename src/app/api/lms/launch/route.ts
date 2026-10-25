import { NextResponse, type NextRequest } from "next/server";

import { getApiBaseUrl } from "@/config/env";
import { ACCESS_COOKIE } from "@/lib/auth/cookie-names";
import { backendHeaders } from "@/lib/auth/server/forward";
import { rejectCrossOrigin } from "@/lib/auth/server/guard";
import type { LmsLaunchResult } from "@/lib/api/lms";
import { authError } from "@/lib/auth/server/respond";

const NO_STORE = { "Cache-Control": "private, no-store" };
const BACKEND_TIMEOUT_MS = 20_000;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** The parent domain the LMS (study.emasteryacademy.com) shares with this site. */
const LMS_COOKIE_DOMAIN = process.env.LMS_COOKIE_DOMAIN ?? ".emasteryacademy.com";
/** Name and attributes the legacy API itself uses for the LMS session cookie. */
const LMS_REFRESH_COOKIE = "refreshToken";

type BackendLaunch = {
  mode: "cookie" | "login";
  redirect_url: string;
  refresh_token?: string | null;
  refresh_expires_at?: string | null;
};

/**
 * "Continue learning". The LMS keeps its session in its own localStorage, which this site can't
 * write, and restores it from the legacy `refreshToken` cookie on the shared parent domain. So the
 * backend hands over the legacy refresh token stored at sign-in, and this handler sets it as that
 * cookie. Off the shared domain (localhost, previews) a cookie can't reach the LMS: the visitor
 * signs in there instead.
 */
export async function POST(request: NextRequest) {
  const denied = rejectCrossOrigin(request);
  if (denied) return denied;

  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  if (!accessToken) return authError(401, "unauthenticated", "سجّل الدخول للمتابعة.");

  let entitlementId: unknown;
  try {
    entitlementId = ((await request.json()) as { entitlementId?: unknown }).entitlementId;
  } catch {
    entitlementId = undefined;
  }
  if (typeof entitlementId !== "string" || !UUID_PATTERN.test(entitlementId)) {
    return authError(400, "invalid_request", "بيانات الطلب غير صحيحة.");
  }

  const headers = backendHeaders(request, accessToken);
  headers.set("Content-Type", "application/json");
  let upstream: Response;
  try {
    upstream = await fetch(`${getApiBaseUrl()}/me/lms/launch`, {
      method: "POST",
      headers,
      body: JSON.stringify({ entitlement_id: entitlementId }),
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
  if (!upstream.ok) return authError(502, "unavailable", "تعذّر فتح منصة التعلّم حالياً. حاول مجدداً بعد قليل.");

  const launch = (await upstream.json()) as BackendLaunch;
  const canShare = launch.mode === "cookie" && launch.refresh_token && onSharedDomain(request);
  if (!canShare) {
    return NextResponse.json({ mode: "login", redirectUrl: lmsLoginUrl(launch) } satisfies LmsLaunchResult, {
      headers: NO_STORE,
    });
  }
  const response = NextResponse.json({ mode: "cookie", redirectUrl: launch.redirect_url } satisfies LmsLaunchResult, {
    headers: NO_STORE,
  });
  response.cookies.set(LMS_REFRESH_COOKIE, launch.refresh_token as string, {
    domain: LMS_COOKIE_DOMAIN,
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "none",
    expires: launch.refresh_expires_at ? new Date(launch.refresh_expires_at) : undefined,
  });
  return response;
}

function onSharedDomain(request: NextRequest): boolean {
  const host = (request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "").split(":")[0];
  const parent = LMS_COOKIE_DOMAIN.replace(/^\./, "");
  return host === parent || host.endsWith(`.${parent}`);
}

function lmsLoginUrl(launch: BackendLaunch): string {
  if (launch.mode === "login") return launch.redirect_url;
  return `${new URL(launch.redirect_url).origin}/auth/login`;
}
