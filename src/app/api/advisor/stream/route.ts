import type { NextRequest } from "next/server";

import { getApiBaseUrl } from "@/config/env";
import { ACCESS_COOKIE } from "@/lib/auth/cookie-names";
import { backendHeaders } from "@/lib/auth/server/forward";
import { rejectCrossOrigin } from "@/lib/auth/server/guard";
import { authError } from "@/lib/auth/server/respond";

/** The backend's own limit on a question. */
const MAX_QUESTION_CHARS = 1000;
/** Until the backend answers at all; once streaming, the stream runs as long as it needs. */
const CONNECT_TIMEOUT_MS = 20_000;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type StreamBody = { question: string; conversation_id: string | null; locale: "ar" | "en" };

function parseBody(raw: unknown): StreamBody | null {
  if (!raw || typeof raw !== "object") return null;
  const { question, conversation_id: conversationId, locale } = raw as Record<string, unknown>;
  if (typeof question !== "string") return null;
  const text = question.trim();
  if (!text || text.length > MAX_QUESTION_CHARS) return null;
  if (conversationId != null && (typeof conversationId !== "string" || !UUID_PATTERN.test(conversationId))) return null;
  return { question: text, conversation_id: conversationId ?? null, locale: locale === "en" ? "en" : "ar" };
}

/**
 * The AI advisor's answer stream (server-sent events), for the advisor widget. The `/api/b2c` door
 * buffers responses, so this one pipes the backend's stream through as it arrives. The visitor's
 * session, when there is one, rides along as a bearer token; guests are answered too.
 */
export async function POST(request: NextRequest) {
  const denied = rejectCrossOrigin(request);
  if (denied) return denied;

  let body: StreamBody | null;
  try {
    body = parseBody(await request.json());
  } catch {
    body = null;
  }
  if (!body) return authError(400, "invalid_request", "بيانات الطلب غير صحيحة.");

  const headers = backendHeaders(request, request.cookies.get(ACCESS_COOKIE)?.value);
  headers.set("Content-Type", "application/json");
  headers.set("Accept", "text/event-stream");
  const requestId = request.headers.get("x-request-id");
  if (requestId && UUID_PATTERN.test(requestId)) headers.set("X-Request-ID", requestId);

  // The visitor closing the chat (or leaving) aborts the backend call too.
  const connect = AbortSignal.timeout(CONNECT_TIMEOUT_MS);
  const controller = new AbortController();
  const abort = () => controller.abort();
  request.signal.addEventListener("abort", abort);
  connect.addEventListener("abort", abort);

  let upstream: Response;
  try {
    upstream = await fetch(`${getApiBaseUrl()}/advisor/stream`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      cache: "no-store",
      signal: controller.signal,
    });
  } catch (error) {
    console.error("[advisor] backend stream failed", error);
    return authError(502, "unavailable", "تعذّر الوصول للمستشار حالياً. حاول بعد شوي.");
  } finally {
    connect.removeEventListener("abort", abort);
  }

  if (!upstream.ok || !upstream.body) {
    const responseHeaders = new Headers({ "Cache-Control": "private, no-store" });
    const retryAfter = upstream.headers.get("Retry-After");
    if (retryAfter) responseHeaders.set("Retry-After", retryAfter);
    responseHeaders.set("Content-Type", upstream.headers.get("Content-Type") ?? "application/json");
    return new Response(await upstream.text(), { status: upstream.status, headers: responseHeaders });
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "private, no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
