import { ApiError } from "@/lib/api/client";

const FALLBACK = "حدث خطأ غير متوقع. حاول مجدداً.";
const OFFLINE = "تعذّر الاتصال بالخادم. تحقق من اتصالك بالإنترنت ثم حاول مجدداً.";

/**
 * The message to show for a failed auth request. The `/api/auth/*` handlers answer with a message
 * written for the visitor (`detail`); anything else (an HTML error page, no network) gets a fixed one.
 */
export function authErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return typeof error.details.detail === "string" ? error.message : FALLBACK;
  }
  return error instanceof TypeError ? OFFLINE : FALLBACK;
}

/** Seconds a 429 asks to wait; null for any other error. */
export function retryAfterSeconds(error: unknown): number | null {
  if (!(error instanceof ApiError) || error.status !== 429) return null;
  const seconds = Number(error.details.retryAfter);
  return Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds) : null;
}
