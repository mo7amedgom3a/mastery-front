import type { NextRequest } from "next/server";

import { getApiBaseUrl } from "@/config/env";
import { AVATAR_MAX_BYTES, AVATAR_TYPES } from "@/lib/api/avatar";
import type { AvatarUploadUrlResponse, CustomerProfileResponse } from "@/lib/api/customers";
import { ACCESS_COOKIE } from "@/lib/auth/cookie-names";
import { backendHeaders } from "@/lib/auth/server/forward";
import { rejectCrossOrigin } from "@/lib/auth/server/guard";
import { authError, authJson } from "@/lib/auth/server/respond";

const TIMEOUT_MS = 30_000;

/** A backend failure passed on: 401 lets the page renew the session and try again. */
function upstreamError(status: number) {
  if (status === 401) return authError(401, "unauthenticated", "سجّل الدخول للمتابعة.");
  return authError(502, "unavailable", "تعذّر رفع الصورة حالياً. حاول مجدداً بعد قليل.");
}

/**
 * Sets the signed-in customer's profile picture. The backend hands out a presigned S3 upload URL,
 * the bytes go to S3, then the backend records the key. The upload is done here rather than by the
 * browser so it doesn't depend on the bucket allowing this site's origin (CORS).
 * Body: multipart form with one `file` (PNG, JPEG or WebP, up to 5 MB). Answers the updated profile.
 */
export async function POST(request: NextRequest) {
  const denied = rejectCrossOrigin(request);
  if (denied) return denied;
  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  if (!accessToken) return authError(401, "unauthenticated", "سجّل الدخول للمتابعة.");

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File) || file.size === 0) return authError(400, "invalid_request", "اختر صورة لرفعها.");
  if (!AVATAR_TYPES.has(file.type)) {
    return authError(400, "invalid_request", "الصيغ المدعومة: PNG أو JPG أو WebP.");
  }
  if (file.size > AVATAR_MAX_BYTES) return authError(400, "invalid_request", "حجم الصورة أكبر من 5 ميجابايت.");

  const json = () => {
    const headers = backendHeaders(request, accessToken);
    headers.set("Content-Type", "application/json");
    return headers;
  };
  try {
    const ticket = await fetch(`${getApiBaseUrl()}/me/avatar/upload-url`, {
      method: "POST",
      headers: json(),
      body: JSON.stringify({ filename: file.name || "avatar", content_type: file.type }),
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!ticket.ok) return upstreamError(ticket.status);
    const upload = (await ticket.json()) as AvatarUploadUrlResponse;

    const stored = await fetch(upload.upload_url, {
      method: "PUT",
      headers: { "Content-Type": upload.content_type ?? file.type },
      body: await file.arrayBuffer(),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!stored.ok) {
      console.error("[avatar] storage upload failed", stored.status);
      return upstreamError(502);
    }

    const confirmed = await fetch(`${getApiBaseUrl()}/me/avatar`, {
      method: "PUT",
      headers: json(),
      body: JSON.stringify({ key: upload.key, bucket: upload.bucket }),
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!confirmed.ok) return upstreamError(confirmed.status);
    return authJson((await confirmed.json()) as CustomerProfileResponse);
  } catch (error) {
    console.error("[avatar] upload failed", error);
    return upstreamError(502);
  }
}
