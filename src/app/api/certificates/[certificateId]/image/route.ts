import { NextResponse, type NextRequest } from "next/server";

import { getApiBaseUrl } from "@/config/env";
import { ACCESS_COOKIE } from "@/lib/auth/cookie-names";
import { backendHeaders } from "@/lib/auth/server/forward";
import { authError } from "@/lib/auth/server/respond";

const TIMEOUT_MS = 30_000;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The signed-in customer's certificate as a PNG (dashboard preview, "save image", native share). */
export async function GET(request: NextRequest, context: RouteContext<"/api/certificates/[certificateId]/image">) {
  const { certificateId } = await context.params;
  if (!UUID_PATTERN.test(certificateId)) return authError(404, "invalid_request", "الشهادة غير موجودة.");
  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  if (!accessToken) return authError(401, "unauthenticated", "سجّل الدخول للمتابعة.");

  let upstream: Response;
  try {
    upstream = await fetch(`${getApiBaseUrl()}/me/certificates/${certificateId}/image.png`, {
      headers: backendHeaders(request, accessToken),
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    console.error("[certificates] image request failed", certificateId, error);
    return authError(502, "unavailable", "تعذّر تحميل صورة الشهادة حالياً.");
  }
  if (upstream.status === 401) return authError(401, "unauthenticated", "سجّل الدخول للمتابعة.");
  if (!upstream.ok || !upstream.body) return authError(upstream.status === 404 ? 404 : 502, "unavailable", "صورة الشهادة غير متاحة.");
  const download = request.nextUrl.searchParams.get("download") === "1";
  return new NextResponse(upstream.body, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "private, max-age=300",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="mastery-certificate.png"`,
    },
  });
}
