import { getWebInstrumentations, initializeFaro, type Faro } from "@grafana/faro-web-sdk";
import { TracingInstrumentation } from "@grafana/faro-web-tracing";

import { bindFaro, syncFaroIdentity } from "@/lib/observability/faro-bridge";

/**
 * Grafana Faro (Real User Monitoring). This module owns the heavy SDK; it is loaded on idle from
 * `instrumentation-client.ts` (not statically imported by pages or error boundaries). All other
 * modules talk to `faro-bridge.ts`, which queues calls until `bindFaro` runs here.
 *
 * Initialization is deliberately best-effort: a monitoring failure must never break the application.
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
 * Starts Faro and binds it to the bridge. No-ops when `NEXT_PUBLIC_FARO_URL` is unset (e.g. a clone
 * with no observability credentials). Web vitals use buffered PerformanceObserver entries, so a
 * deferred start still reports FCP/LCP/CLS; the bridge replays errors captured before this ran.
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

  if (faro) {
    const client = faro;
    bindFaro({
      setUser: (id) => client.api.setUser({ id }),
      resetUser: () => client.api.resetUser(),
      pushError: (error, context) => client.api.pushError(error, context ? { context } : undefined),
      sessionId: () => client.api.getSession()?.id,
    });
    syncFaroIdentity();
  }

  return faro;
}
