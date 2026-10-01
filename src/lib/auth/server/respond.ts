import "server-only";

import { NextResponse, type NextRequest } from "next/server";
import type { z } from "zod";

import { ApiError } from "@/lib/api/client";
import type { AuthErrorBody, AuthErrorCode } from "@/lib/auth/contract";

/** Per visitor: never stored by a shared cache. */
const NO_STORE = { "Cache-Control": "private, no-store" };

export function authJson<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status, headers: NO_STORE });
}

export function authError(status: number, code: AuthErrorCode, detail: string, retryAfter?: number): NextResponse {
  const headers: Record<string, string> = retryAfter ? { ...NO_STORE, "Retry-After": String(retryAfter) } : NO_STORE;
  return NextResponse.json({ code, detail } satisfies AuthErrorBody, { status, headers });
}

/**
 * The backend only accepts addresses at trusted mailbox providers (`AUTH_ALLOWED_EMAIL_DOMAINS`)
 * and answers 422 for any other. Null for every other error.
 */
export function emailRejected(error: unknown): NextResponse | null {
  if (!isBackendStatus(error, 422)) return null;
  if (error.message === "Email domain is not allowed") {
    return authError(
      422,
      "email_not_allowed",
      "استخدم بريداً من Gmail أو Outlook أو Hotmail أو Yahoo أو iCloud؛ لا نقبل نطاقات البريد الأخرى.",
    );
  }
  return authError(422, "invalid_request", "أدخل بريداً إلكترونياً صحيحاً.");
}

export function isBackendStatus(error: unknown, status: number): error is ApiError {
  return error instanceof ApiError && error.status === status;
}

/**
 * The answer for a backend call that failed for a reason the visitor can't fix. What the backend
 * said stays in the server log: its messages quote the legacy system and are not for the browser.
 */
export function backendFailure(scope: string, error: unknown): NextResponse {
  if (isBackendStatus(error, 429)) {
    const retryAfter = Number(error.details.retryAfter);
    return authError(
      429,
      "rate_limited",
      "محاولات كثيرة خلال وقت قصير. انتظر قليلاً ثم حاول مجدداً.",
      Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : 60,
    );
  }
  console.error(`[auth] ${scope} failed`, error);
  return authError(502, "unavailable", "تعذّر إتمام الطلب حالياً. حاول مجدداً بعد قليل.");
}

/** The request's JSON body checked against `schema`; a ready 400 response when it doesn't fit. */
export async function readAuthBody<S extends z.ZodType>(
  request: NextRequest,
  schema: S,
): Promise<{ data: z.infer<S> } | { error: NextResponse }> {
  const invalid = { error: authError(400, "invalid_request", "بيانات الطلب غير صحيحة.") };
  if (!request.headers.get("content-type")?.includes("application/json")) return invalid;
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return invalid;
  }
  const parsed = schema.safeParse(raw);
  return parsed.success ? { data: parsed.data } : invalid;
}
