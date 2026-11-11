import type { Instrumentation } from "next";

/**
 * Next.js server instrumentation. `register` runs once per server instance, before it serves
 * requests; `onRequestError` reports every server error Next.js captures (rendering, route
 * handlers, server actions and the middleware) to the OTLP log stream, correlated with the
 * request's trace.
 *
 * The OTel SDK lives in ./instrumentation-node and is imported only inside
 * `if (process.env.NEXT_RUNTIME === "nodejs" && process.env.NEXT_PUBLIC_DEPLOY_TARGET !== "cloudflare")`.
 * Both values are replaced at build time, so webpack drops the import from the Edge middleware
 * bundle and from the Cloudflare Workers build (where the Node SDK cannot run on workerd). On
 * Cloudflare, server errors go to Workers Logs (wrangler.jsonc `observability`) instead; browser
 * telemetry (Faro, PostHog) is unaffected.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.NEXT_PUBLIC_DEPLOY_TARGET !== "cloudflare") {
    const { registerNode } = await import("./instrumentation-node");
    registerNode();
  }
}

export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.NEXT_PUBLIC_DEPLOY_TARGET !== "cloudflare") {
    const { reportRequestErrorNode } = await import("./instrumentation-node");
    await reportRequestErrorNode(error, request, context);
  } else if (process.env.NEXT_PUBLIC_DEPLOY_TARGET === "cloudflare") {
    console.error("[onRequestError]", request.method, request.path, context.routePath, error);
  }
};
