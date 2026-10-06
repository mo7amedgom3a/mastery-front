import { getWebInstrumentations, initializeFaro, type Faro } from "@grafana/faro-web-sdk";
import { TracingInstrumentation } from "@grafana/faro-web-tracing";

import { getClientFingerprint } from "@/lib/customer-tracking";

/**
 * Grafana Faro (Real User Monitoring) lives behind this module so client code and the
 * Next.js instrumentation entry point share one instance. Initialization is deliberately
 * best-effort: a monitoring failure must never break the application.
 */
let faro: Faro | undefined;

type FaroClientConfig = {
  url: string;
  name: string;
  environment: string;
  version: string;
};

function readConfig(): FaroClientConfig | null {
  const url = process.env.NEXT_PUBLIC_FARO_URL?.trim();
  if (!url) return null;

  return {
    url,
    name: process.env.NEXT_PUBLIC_FARO_APP_NAME?.trim() || "mastery-app",
    environment:
      process.env.NEXT_PUBLIC_FARO_APP_NAMESPACE?.trim() || process.env.NODE_ENV || "development",
    version: process.env.NEXT_PUBLIC_FARO_APP_VERSION?.trim() || "0.0.0",
  };
}

/**
 * Starts Faro. Called from `instrumentation-client.ts` before hydration, so error tracking and web
 * vitals capture the first paint. No-ops when `NEXT_PUBLIC_FARO_URL` is unset (e.g. a clone with no
 * observability credentials).
 */
export function initFaro(): Faro | undefined {
  if (faro) return faro;

  const config = readConfig();
  if (!config) return undefined;

  try {
    faro = initializeFaro({
      url: config.url,
      app: {
        name: config.name,
        version: config.version,
        environment: config.environment,
      },
      // getWebInstrumentations covers errors, web vitals, console, user actions and sessions;
      // TracingInstrumentation adds fetch/XHR spans (and forwards the W3C trace context to the
      // Next.js server so browser and server spans land in the same trace).
      instrumentations: [...getWebInstrumentations(), new TracingInstrumentation()],
    });
  } catch (error) {
    console.warn("[faro] initialization failed", error);
  }

  syncFaroIdentity();
  return faro;
}

/**
 * Attaches the visitor to every subsequent signal. Signed-in visitors are keyed by their opaque
 * customer id; guests fall back to the random `clientFingerprint` already kept in localStorage, so
 * anonymous browsing can still be followed across pages without any PII.
 */
export function syncFaroIdentity(customerId?: string | null): void {
  if (!faro) return;
  const id = customerId ?? getClientFingerprint();
  if (id) faro.api.setUser({ id });
  else faro.api.resetUser();
}

/** Reports a caught error (e.g. a React error boundary) to Faro. */
export function pushFaroError(error: unknown, context?: Record<string, string>): void {
  if (!faro) return;
  const value = error instanceof Error ? error : new Error(String(error));
  faro.api.pushError(value, context ? { context } : undefined);
}

/** The current Faro session id, so product analytics can link a replay to its RUM session. */
export function getFaroSessionId(): string | undefined {
  return faro?.api.getSession()?.id;
}
