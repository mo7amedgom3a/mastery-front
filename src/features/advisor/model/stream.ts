import { ApiError } from "@/lib/api/client";
import { refreshOnce } from "@/lib/auth/client";
import { createRequestId, getClientFingerprint } from "@/lib/customer-tracking";

import type { AdvisorEvent } from "./types";

export type StreamRequest = { question: string; conversationId: string | null; locale: "ar" | "en" };

function post(request: StreamRequest, signal: AbortSignal): Promise<Response> {
  const headers = new Headers({ "Content-Type": "application/json", Accept: "text/event-stream" });
  const fingerprint = getClientFingerprint();
  if (fingerprint) headers.set("X-Client-Fingerprint", fingerprint);
  headers.set("X-Request-ID", createRequestId());
  return fetch("/api/advisor/stream", {
    method: "POST",
    headers,
    body: JSON.stringify({ question: request.question, conversation_id: request.conversationId, locale: request.locale }),
    signal,
  });
}

/**
 * Asks the advisor and hands each server-sent event to `onEvent` as it arrives; resolves when the
 * stream ends. Frames are `data: {json}` blocks; the event's `type` is inside the JSON. An expired
 * session is renewed once and the question asked again, as `customerRequest` does.
 */
export async function streamAdvisor(
  request: StreamRequest,
  onEvent: (event: AdvisorEvent) => void,
  signal: AbortSignal,
): Promise<void> {
  let response = await post(request, signal);
  if (response.status === 401 && (await refreshOnce())) response = await post(request, signal);
  if (!response.ok || !response.body) {
    throw new ApiError(response.status, `advisor stream ${response.status}`, { retryAfter: response.headers.get("Retry-After") });
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let boundary = buffer.indexOf("\n\n");
    while (boundary !== -1) {
      const block = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      const data = block
        .split("\n")
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trim())
        .join("\n");
      if (data) {
        try {
          onEvent(JSON.parse(data) as AdvisorEvent);
        } catch {
          // A malformed frame is skipped; the final event still carries the whole answer.
        }
      }
      boundary = buffer.indexOf("\n\n");
    }
  }
}
