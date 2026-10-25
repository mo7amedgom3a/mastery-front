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
  // Onboarding choices (skills, topics, product types), read by the client onboarding steps.
  { methods: ["GET"], pattern: /^catalog\/onboarding-options$/, session: false },
  // Company and trainer requests: country list, phone codes, and cities.
  { methods: ["GET"], pattern: /^requests\/countries$/, session: false },
  { methods: ["GET"], pattern: /^requests\/phone-codes$/, session: false },
  { methods: ["GET"], pattern: /^requests\/countries\/phone-codes$/, session: false },
  { methods: ["GET"], pattern: /^requests\/countries\/[A-Z]{2}\/cities$/, session: false },
  { methods: ["PUT"], pattern: /^requests\/company-training\/draft$/, session: false },
  { methods: ["POST"], pattern: /^requests\/trainer-attachments\/presign$/, session: false },
  { methods: ["POST"], pattern: /^requests\/trainer-attachments\/[A-Za-z0-9-]+\/confirm$/, session: false },
  // Live-diploma catalog reads (list, detail, cohorts, one cohort): public discovery.
  { methods: ["GET"], pattern: /^catalog\/live-diplomas(\/[A-Za-z0-9-]+(\/cohorts(\/[A-Za-z0-9-]+)?)?)?$/, session: false },
  // Live-diploma waitlist: join, read and leave the signed-in customer's entry.
  { methods: ["POST"], pattern: /^catalog\/live-diplomas\/[A-Za-z0-9-]+\/waitlist$/, session: true },
  { methods: ["GET", "DELETE"], pattern: /^catalog\/live-diplomas\/[A-Za-z0-9-]+\/waitlist\/me$/, session: true },
  // Behavior events from the browser; open to guests too (identified by X-Client-Fingerprint).
  { methods: ["POST"], pattern: /^analytics\/events$/, session: false },
  // The signed-in customer's cart, checkout and purchases.
  { methods: ["GET"], pattern: /^cart$/, session: true },
  { methods: ["POST"], pattern: /^cart\/items$/, session: true },
  { methods: ["PATCH", "DELETE"], pattern: /^cart\/items\/[A-Za-z0-9-]+$/, session: true },
  { methods: ["POST"], pattern: /^checkout\/(quote|sessions|free-enrollments)$/, session: true },
  // Buying more access time for an entitlement (options are read under `me/`).
  { methods: ["POST"], pattern: /^access-extensions\/checkout$/, session: true },
  { methods: ["GET"], pattern: /^payments\/intents\/[A-Za-z0-9-]+$/, session: true },
  { methods: ["POST"], pattern: /^payments\/intents\/[A-Za-z0-9-]+\/reconcile$/, session: true },
  // Tamara eligibility, instalment plans and widget key for the cart total: public.
  { methods: ["GET"], pattern: /^payments\/tamara\/options$/, session: false },
  // Affiliates program terms (public) and marketer applications.
  { methods: ["GET"], pattern: /^affiliates\/program$/, session: false },
  { methods: ["POST"], pattern: /^affiliates\/applications$/, session: false },
  { methods: ["GET"], pattern: /^affiliates\/referrals\/resolve$/, session: false },
  { methods: ["GET"], pattern: /^orders(\/[A-Za-z0-9-]+(\/(invoices|transactions))?)?$/, session: true },
  // Customer refund previews, requests and case history on paid order items.
  { methods: ["GET"], pattern: /^refund-cases\/me$/, session: true },
  { methods: ["GET"], pattern: /^refund-cases\/orders\/[A-Za-z0-9-]+\/items\/[A-Za-z0-9-]+\/preview$/, session: true },
  { methods: ["POST"], pattern: /^refund-cases\/orders\/[A-Za-z0-9-]+\/requests$/, session: true },
  // In-app notifications (the dashboard bell): list, unread count, mark read.
  { methods: ["GET"], pattern: /^me\/notifications(\/unread-count)?$/, session: true },
  { methods: ["POST"], pattern: /^me\/notifications\/([A-Za-z0-9-]+\/read|read-all)$/, session: true },
  // Subscriptions: public plans and feature catalog, then the customer's checkout and plan.
  { methods: ["GET"], pattern: /^subscriptions\/(plans(\/[A-Za-z0-9_-]+)?|features)$/, session: false },
  { methods: ["POST"], pattern: /^subscriptions\/checkout$/, session: true },
  { methods: ["POST"], pattern: /^subscriptions\/team-leads$/, session: true },
  { methods: ["GET"], pattern: /^subscriptions\/me(\/[A-Za-z0-9-]+(\/selections)?)?$/, session: true },
  { methods: ["POST"], pattern: /^subscriptions\/me\/[A-Za-z0-9-]+\/(cancel|selections|selections\/replace)$/, session: true },
  // Recommendations for the signed-in customer (dashboard, after onboarding).
  { methods: ["GET"], pattern: /^recommendations\/me$/, session: true },
  // Consultations: public free slots, then booking, the meeting room and its recording.
  { methods: ["GET"], pattern: /^consultations\/products\/[A-Za-z0-9_-]+\/availability$/, session: false },
  { methods: ["POST"], pattern: /^consultations\/bookings$/, session: true },
  { methods: ["GET"], pattern: /^consultations\/bookings\/[A-Za-z0-9-]+(\/recording)?$/, session: true },
  // Whiteboard files of a session (uploads go through /api/consultations/[bookingId]/assets).
  { methods: ["GET"], pattern: /^consultations\/bookings\/[A-Za-z0-9-]+\/assets(\/[A-Za-z0-9-]+)?$/, session: true },
  { methods: ["POST"], pattern: /^consultations\/bookings\/[A-Za-z0-9-]+\/join$/, session: true },
  // The expert's own area (403 for customers who are not linked to a consultant).
  { methods: ["GET"], pattern: /^experts\/me(\/(slots|bookings|summary|services))?$/, session: true },
  { methods: ["PATCH"], pattern: /^experts\/me$/, session: true },
  { methods: ["POST"], pattern: /^experts\/me\/services$/, session: true },
  { methods: ["PATCH", "DELETE"], pattern: /^experts\/me\/services\/[A-Za-z0-9-]+$/, session: true },
  { methods: ["GET"], pattern: /^experts\/me\/bookings\/[A-Za-z0-9-]+$/, session: true },
  { methods: ["POST"], pattern: /^experts\/me\/slots$/, session: true },
  { methods: ["POST"], pattern: /^experts\/me\/bookings\/[A-Za-z0-9-]+\/(approve|reject|cancel)$/, session: true },
  // Support ticket management: categories, related options, tickets, messages, reopen, feedback, download
  { methods: ["GET"], pattern: /^support\/categories$/, session: false },
  { methods: ["GET"], pattern: /^support\/related-options$/, session: true },
  { methods: ["GET", "POST"], pattern: /^support\/tickets$/, session: true },
  { methods: ["GET"], pattern: /^support\/tickets\/[A-Za-z0-9-]+(\/messages)?$/, session: true },
  { methods: ["POST"], pattern: /^support\/tickets\/[A-Za-z0-9-]+\/(messages|reopen|feedback)$/, session: true },
  { methods: ["GET"], pattern: /^support\/attachments\/[A-Za-z0-9-]+\/download$/, session: true },
];

/**
 * Never through this door: the LMS hand-off answers with the legacy refresh token, which only
 * `/api/lms/launch` may see (it turns it into an httpOnly cookie).
 */
const BLOCKED: readonly RegExp[] = [/^me\/lms(\/|$)/];

/** Same charset the backend accepts; anything else is dropped rather than forwarded. */
const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9._:-]{1,200}$/;

type Context = RouteContext<"/api/b2c/[...path]">;

/**
 * Same-origin door to the backend for the browser. The backend lives on another origin that the
 * session cookies are never sent to; here the access token is read from its httpOnly cookie and
 * passed on as a bearer token. An expired token comes back as the backend's 401: the page then
 * refreshes the session (`/api/auth/refresh`) and asks again.
 */
async function forward(request: NextRequest, context: Context): Promise<NextResponse> {
  const path = (await context.params).path.join("/");
  if (BLOCKED.some((pattern) => pattern.test(path))) return authError(404, "invalid_request", "المورد غير موجود.");
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
  const idempotencyKey = request.headers.get("idempotency-key");
  if (mutation && idempotencyKey && IDEMPOTENCY_KEY_PATTERN.test(idempotencyKey)) {
    headers.set("Idempotency-Key", idempotencyKey);
  }
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
