import { NextResponse, type NextRequest } from "next/server";

import { getApiBaseUrl } from "@/config/env";
import { ACCESS_COOKIE } from "@/lib/auth/cookie-names";
import { backendHeaders } from "@/lib/auth/server/forward";
import { rejectCrossOrigin } from "@/lib/auth/server/guard";
import { authError } from "@/lib/auth/server/respond";

const NO_STORE = { "Cache-Control": "private, no-store" };
const BACKEND_TIMEOUT_MS = 20_000;
const MAX_BODY_BYTES = 64 * 1024;

type Rule = { methods: readonly string[]; pattern: RegExp; session: boolean };

/**
 * The backend calls a page may make through this app, and nothing else. `session`: the call is
 * about the signed-in customer, so it is refused outright without an access token.
 */
const RULES: readonly Rule[] = [
  { methods: ["GET", "POST", "PUT", "PATCH", "DELETE"], pattern: /^me(\/[A-Za-z0-9_-]+)*$/, session: true },
  // Read by wishlist sync to turn a legacy id into a catalog product id.
  { methods: ["GET"], pattern: /^catalog\/products\/[A-Za-z0-9_-]+$/, session: false },
  // Behavior events from the browser; open to guests too (identified by X-Client-Fingerprint).
  { methods: ["POST"], pattern: /^analytics\/events$/, session: false },
];

type Context = RouteContext<"/api/b2c/[...path]">;

/**
 * Same-origin door to the backend for the browser. The backend lives on another origin that the
 * session cookies are never sent to; here the access token is read from its httpOnly cookie and
 * passed on as a bearer token. An expired token comes back as the backend's 401: the page then
 * refreshes the session (`/api/auth/refresh`) and asks again.
 */
async function forward(request: NextRequest, context: Context): Promise<NextResponse> {
  const path = (await context.params).path.join("/");
  const rule = RULES.find((candidate) => candidate.methods.includes(request.method) && candidate.pattern.test(path));
  if (!rule) return authError(404, "invalid_request", "المورد غير موجود.");

  const mutation = request.method !== "GET";
  if (mutation) {
    const denied = rejectCrossOrigin(request);
    if (denied) return denied;
  }

  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  if (rule.session && !accessToken) {
    return authError(401, "unauthenticated", "سجّل الدخول للمتابعة.");
  }

  const headers = backendHeaders(request, accessToken);
  let body: string | undefined;
  if (mutation && request.method !== "DELETE") {
    body = await request.text();
    if (body.length > MAX_BODY_BYTES) return authError(400, "invalid_request", "بيانات الطلب غير صحيحة.");
    if (body) headers.set("Content-Type", "application/json");
    else body = undefined;
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${getApiBaseUrl()}/${path}${request.nextUrl.search}`, {
      method: request.method,
      headers,
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(BACKEND_TIMEOUT_MS),
    });
  } catch (error) {
    console.error("[b2c] backend request failed", request.method, path, error);
    return authError(502, "unavailable", "تعذّر إتمام الطلب حالياً. حاول مجدداً بعد قليل.");
  }

  // Only what the page needs from the backend's response: status, JSON body, and the wait on a 429.
  const responseHeaders = new Headers(NO_STORE);
  const retryAfter = upstream.headers.get("Retry-After");
  if (retryAfter) responseHeaders.set("Retry-After", retryAfter);
  if (upstream.status === 204 || upstream.status === 304) {
    return new NextResponse(null, { status: upstream.status, headers: responseHeaders });
  }
  responseHeaders.set("Content-Type", upstream.headers.get("Content-Type") ?? "application/json");
  return new NextResponse(await upstream.text(), { status: upstream.status, headers: responseHeaders });
}

export { forward as GET, forward as POST, forward as PUT, forward as PATCH, forward as DELETE };
