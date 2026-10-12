import type { NextRequest } from "next/server";

import { getApiBaseUrl } from "@/config/env";
import { ACCESS_COOKIE } from "@/lib/auth/cookie-names";
import { backendHeaders } from "@/lib/auth/server/forward";
import { authError } from "@/lib/auth/server/respond";

const TIMEOUT_MS = 30_000;
const ID_PATTERN = /^[A-Za-z0-9-]{1,64}$/;

type Context = RouteContext<"/api/consultations/[bookingId]/assets/[assetId]">;

/**
 * One session file (whiteboard snapshot or board image), streamed from S3 by this app. A stable
 * same-origin URL: the board keeps working after a presigned link would have expired, and exporting
 * the board to an image never hits S3's CORS. Only the booking's participants get the bytes.
 */
export async function GET(request: NextRequest, context: Context) {
  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  if (!accessToken) return authError(401, "unauthenticated", "سجّل الدخول للمتابعة.");
  const { bookingId, assetId } = await context.params;
  if (!ID_PATTERN.test(bookingId) || !ID_PATTERN.test(assetId)) {
    return authError(404, "invalid_request", "المورد غير موجود.");
  }

  try {
    const link = await fetch(
      `${getApiBaseUrl()}/consultations/bookings/${encodeURIComponent(bookingId)}/assets/${encodeURIComponent(assetId)}`,
      {
        headers: backendHeaders(request, accessToken),
        cache: "no-store",
        signal: AbortSignal.timeout(TIMEOUT_MS),
      },
    );
    if (link.status === 401) return authError(401, "unauthenticated", "سجّل الدخول للمتابعة.");
    if (!link.ok) return authError(404, "invalid_request", "المورد غير موجود.");
    const { url, content_type: contentType } = (await link.json()) as { url: string; content_type: string };

    const object = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!object.ok || !object.body) {
      console.error("[session-assets] storage read failed", object.status);
      return authError(502, "unavailable", "تعذّر تحميل الملف حالياً.");
    }
    const headers = new Headers({
      "Content-Type": contentType,
      "Cache-Control": "private, max-age=300",
      "X-Content-Type-Options": "nosniff",
    });
    const length = object.headers.get("Content-Length");
    if (length) headers.set("Content-Length", length);
    return new Response(object.body, { status: 200, headers });
  } catch (error) {
    console.error("[session-assets] read failed", error);
    return authError(502, "unavailable", "تعذّر تحميل الملف حالياً.");
  }
}
