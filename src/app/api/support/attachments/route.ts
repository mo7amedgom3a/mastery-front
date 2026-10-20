import type { NextRequest } from "next/server";

import { getApiBaseUrl } from "@/config/env";
import { ACCESS_COOKIE } from "@/lib/auth/cookie-names";
import { backendHeaders } from "@/lib/auth/server/forward";
import { rejectCrossOrigin } from "@/lib/auth/server/guard";
import { authError, authJson } from "@/lib/auth/server/respond";

const TIMEOUT_MS = 30_000;
const MAX_BYTES = 15 * 1024 * 1024; // 15 MB
const ALLOWED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/zip",
]);

function upstreamError(status: number) {
  if (status === 401) return authError(401, "unauthenticated", "سجّل الدخول للمتابعة.");
  if (status === 404) return authError(404, "invalid_request", "التذكرة غير موجودة.");
  if (status === 422) return authError(400, "invalid_request", "الملف غير مدعوم.");
  return authError(502, "unavailable", "تعذّر رفع الملف حالياً. حاول مجدداً بعد قليل.");
}

/**
 * Uploads a support ticket or reply attachment directly to private S3 via presigned PUT.
 * Next.js server proxies the bytes directly to S3 so client never runs into S3 CORS limitations.
 */
export async function POST(request: NextRequest) {
  const denied = rejectCrossOrigin(request);
  if (denied) return denied;

  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  if (!accessToken) return authError(401, "unauthenticated", "سجّل الدخول للمتابعة.");

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  const ticketId = form?.get("ticket_id");

  if (!(file instanceof File) || file.size === 0) {
    return authError(400, "invalid_request", "اختر ملفاً صالحاً لرفعه.");
  }
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return authError(400, "invalid_request", "نوع الملف غير مدعوم. الصيغ المدعومة: صور، PDF، مستندات Word، ملفات مضغوطة.");
  }
  if (file.size > MAX_BYTES) {
    return authError(400, "invalid_request", "حجم الملف يتجاوز الحد الأقصى المسموح (15 ميجابايت).");
  }

  const jsonHeaders = () => {
    const headers = backendHeaders(request, accessToken);
    headers.set("Content-Type", "application/json");
    return headers;
  };

  const presignPayload: Record<string, unknown> = {
    filename: file.name,
    content_type: file.type,
    size_bytes: file.size,
  };
  if (typeof ticketId === "string" && ticketId.trim()) {
    presignPayload.ticket_id = ticketId.trim();
  }

  try {
    // 1. Request upload intent from backend
    const presignRes = await fetch(`${getApiBaseUrl()}/support/attachments/presign`, {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify(presignPayload),
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!presignRes.ok) return upstreamError(presignRes.status);
    const intent = (await presignRes.json()) as {
      attachment_id: string;
      upload_url: string;
      content_type: string;
    };

    // 2. Stream bytes to private S3 bucket
    const s3Res = await fetch(intent.upload_url, {
      method: "PUT",
      headers: { "Content-Type": intent.content_type },
      body: await file.arrayBuffer(),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!s3Res.ok) {
      console.error("[support-attachments] S3 upload failed", s3Res.status);
      return upstreamError(502);
    }

    // 3. Confirm completed upload on backend
    const confirmRes = await fetch(
      `${getApiBaseUrl()}/support/attachments/${encodeURIComponent(intent.attachment_id)}/confirm`,
      {
        method: "POST",
        headers: jsonHeaders(),
        cache: "no-store",
        signal: AbortSignal.timeout(TIMEOUT_MS),
      },
    );

    if (!confirmRes.ok) return upstreamError(confirmRes.status);
    const attachment = await confirmRes.json();
    return authJson(attachment);
  } catch (error) {
    console.error("[support-attachments] upload failed", error);
    return upstreamError(502);
  }
}
