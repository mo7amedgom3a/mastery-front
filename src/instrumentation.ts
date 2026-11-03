import type { Instrumentation } from "next";

import { runtimeEnv } from "./config/runtime-env";

/**
 * Next.js server instrumentation. `register` runs once per server instance, before it serves
 * requests; the OTel module is imported dynamically so its Node-only dependencies never reach the
 * Edge runtime or the client bundle.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  // Amplify Hosting provides the app's environment variables only during the
  // build: its SSR runtime starts without them, and every server-side read
  // would fall back to a development default. The build snapshots them into
  // ./config/runtime-env (see scripts/generate-runtime-env.mjs); apply them
  // before anything below reads process.env. Real environment variables, when
  // present (local dev, other hosts), always win.
  for (const [key, value] of Object.entries(runtimeEnv)) {
    if (process.env[key] === undefined) process.env[key] = value;
  }

  const { startOtel } = await import("./lib/observability/server/otel");
  startOtel();
}

/**
 * Reports every server error Next.js captures (rendering, route handlers, server actions and the
 * proxy) to the OTLP log stream, where it is correlated with the request's trace. The log processor
 * is flushed before returning so the record survives the end of a serverless invocation.
 */
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const [{ logError }, { flushOtel }] = await Promise.all([
    import("./lib/observability/server/logger"),
    import("./lib/observability/server/otel"),
  ]);

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
