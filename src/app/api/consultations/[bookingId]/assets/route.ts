import type { NextRequest } from "next/server";

import { getApiBaseUrl } from "@/config/env";
import { SESSION_ASSET_MAX_BYTES, SESSION_ASSET_TYPES, sessionAssetSrc } from "@/lib/api/consultations";
import { ACCESS_COOKIE } from "@/lib/auth/cookie-names";
import { backendHeaders } from "@/lib/auth/server/forward";
import { rejectCrossOrigin } from "@/lib/auth/server/guard";
import { authError, authJson } from "@/lib/auth/server/respond";

const TIMEOUT_MS = 30_000;
const ID_PATTERN = /^[A-Za-z0-9-]{1,64}$/;
const KINDS: ReadonlySet<string> = new Set(["snapshot", "board_image"]);

type Context = RouteContext<"/api/consultations/[bookingId]/assets">;

/** A backend failure passed on: 401 lets the page renew the session and try again. */
function upstreamError(status: number) {
  if (status === 401) return authError(401, "unauthenticated", "سجّل الدخول للمتابعة.");
  if (status === 404) return authError(404, "invalid_request", "لم نجد هذه الجلسة.");
  if (status === 409) return authError(409, "invalid_request", "لا يمكن حفظ الملفات إلا أثناء الجلسة.");
  if (status === 422) return authError(400, "invalid_request", "الملف غير مدعوم.");
  return authError(502, "unavailable", "تعذّر حفظ الملف حالياً. حاول مجدداً بعد قليل.");
}

/**
 * Saves a whiteboard snapshot or board image to the session's files. The backend hands out a
 * presigned S3 upload URL, the bytes go to S3 from here (no dependency on the bucket's CORS), then
 * the backend checks the object. Body: multipart form with `file` (PNG, JPEG or WebP, up to 10 MB)
 * and `kind` (`snapshot` | `board_image`). Answers `{ asset_id, src }`.
 */
export async function POST(request: NextRequest, context: Context) {
  const denied = rejectCrossOrigin(request);
  if (denied) return denied;
  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  if (!accessToken) return authError(401, "unauthenticated", "سجّل الدخول للمتابعة.");
  const { bookingId } = await context.params;
  if (!ID_PATTERN.test(bookingId)) return authError(404, "invalid_request", "المورد غير موجود.");

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  const kind = form?.get("kind");
  if (!(file instanceof File) || file.size === 0) return authError(400, "invalid_request", "اختر صورة لحفظها.");
  if (typeof kind !== "string" || !KINDS.has(kind)) return authError(400, "invalid_request", "بيانات الطلب غير صحيحة.");
  if (!SESSION_ASSET_TYPES.has(file.type)) return authError(400, "invalid_request", "الصيغ المدعومة: PNG أو JPG أو WebP.");
  if (file.size > SESSION_ASSET_MAX_BYTES) return authError(400, "invalid_request", "حجم الصورة أكبر من 10 ميجابايت.");

  const json = () => {
    const headers = backendHeaders(request, accessToken);
    headers.set("Content-Type", "application/json");
    return headers;
  };
  const base = `${getApiBaseUrl()}/consultations/bookings/${encodeURIComponent(bookingId)}/assets`;
  try {
    const ticket = await fetch(`${base}/upload-url`, {
      method: "POST",
      headers: json(),
      body: JSON.stringify({ kind, content_type: file.type, size_bytes: file.size }),
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!ticket.ok) return upstreamError(ticket.status);
    const upload = (await ticket.json()) as { asset_id: string; upload_url: string; content_type: string };

    const stored = await fetch(upload.upload_url, {
      method: "PUT",
      headers: { "Content-Type": upload.content_type },
      body: await file.arrayBuffer(),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!stored.ok) {
      console.error("[session-assets] storage upload failed", stored.status);
      return upstreamError(502);
    }

    const confirmed = await fetch(`${base}/${encodeURIComponent(upload.asset_id)}/complete`, {
      method: "POST",
      headers: json(),
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!confirmed.ok) return upstreamError(confirmed.status);
    // The signed proof for the session recorder rides in the URL: participants ignore it (their cookie is
    // enough), the recorder has nothing else to authenticate with.
    const { recorder_token: recorderToken } = (await confirmed.json().catch(() => ({}))) as { recorder_token?: string };
    const src = sessionAssetSrc(bookingId, upload.asset_id);
    return authJson({ asset_id: upload.asset_id, src: recorderToken ? `${src}?rt=${encodeURIComponent(recorderToken)}` : src });
  } catch (error) {
    console.error("[session-assets] upload failed", error);
    return upstreamError(502);
  }
}
