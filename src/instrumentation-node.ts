import "server-only";

import type { Instrumentation } from "next";

import { logError } from "./lib/observability/server/logger";
import { flushOtel, startOtel } from "./lib/observability/server/otel";

/**
 * Node-only half of src/instrumentation.ts: the OTel SDK and its Node instrumentations. It is
 * imported only behind build-time checks there, so it never reaches the Edge middleware bundle or
 * the Cloudflare Workers build.
 */
export function registerNode(): void {
  startOtel();
}

/** Logs a server error Next.js captured to the OTLP log stream, then flushes it. */
export const reportRequestErrorNode: Instrumentation.onRequestError = async (error, request, context) => {
  const message = error instanceof Error ? error.message : String(error);
  const digest =
    typeof error === "object" && error !== null && "digest" in error
      ? (error as { digest?: unknown }).digest
      : undefined;

  logError(message, {
    "error.type": error instanceof Error ? error.name : typeof error,
    "exception.stacktrace": error instanceof Error ? error.stack : undefined,
    "http.request.method": request.method,
    "url.path": request.path,
    "next.router.kind": context.routerKind,
    "next.route.path": context.routePath,
    "next.route.type": context.routeType,
    "error.digest": typeof digest === "string" ? digest : undefined,
  });

  await flushOtel();
};
