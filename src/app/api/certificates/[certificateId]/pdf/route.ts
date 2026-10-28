import { NextResponse, type NextRequest } from "next/server";

import { getApiBaseUrl } from "@/config/env";
import { ACCESS_COOKIE } from "@/lib/auth/cookie-names";
import { backendHeaders } from "@/lib/auth/server/forward";
import { authError } from "@/lib/auth/server/respond";

const TIMEOUT_MS = 30_000;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * The signed-in customer's certificate PDF. The backend answers with a short-lived S3 link (passed on
 * as a redirect) or, without storage configured, the PDF itself (streamed). `/api/b2c` can't carry
 * either: it reads bodies as text and follows redirects.
 */
export async function GET(request: NextRequest, context: RouteContext<"/api/certificates/[certificateId]/pdf">) {
  const { certificateId } = await context.params;
  if (!UUID_PATTERN.test(certificateId)) return authError(404, "invalid_request", "الشهادة غير موجودة.");
  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  if (!accessToken) return authError(401, "unauthenticated", "سجّل الدخول للمتابعة.");

  const download = request.nextUrl.searchParams.get("download") === "1";
  let upstream: Response;
  try {
    upstream = await fetch(
      `${getApiBaseUrl()}/me/certificates/${certificateId}/pdf${download ? "?download=true" : ""}`,
      {
        headers: backendHeaders(request, accessToken),
        cache: "no-store",
        redirect: "manual",
        signal: AbortSignal.timeout(TIMEOUT_MS),
      },
    );
  } catch (error) {
    console.error("[certificates] pdf request failed", certificateId, error);
    return authError(502, "unavailable", "تعذّر تحميل الشهادة حالياً. حاول مجدداً بعد قليل.");
  }

  const location = upstream.headers.get("Location");
  if (upstream.status >= 300 && upstream.status < 400 && location) {
    return NextResponse.redirect(location, { status: 307, headers: { "Cache-Control": "private, no-store" } });
  }
  if (upstream.status === 401) return authError(401, "unauthenticated", "سجّل الدخول للمتابعة.");
  if (upstream.status === 404) return authError(404, "invalid_request", "الشهادة غير موجودة.");
  if (!upstream.ok || !upstream.body) {
    return authError(upstream.status === 409 ? 409 : 502, "unavailable", "الشهادة غير جاهزة للتحميل بعد.");
  }
  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": upstream.headers.get("Content-Disposition") ?? "inline",
      "Cache-Control": "private, no-store",
    },
  });
}
