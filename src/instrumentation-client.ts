import { trackProductView } from "./lib/observability/behavior";
import { getFaroSessionId, pushFaroError } from "./lib/observability/faro-bridge";
import { initPostHog, registerSuperProps } from "./lib/observability/posthog";

// Runs once, after the document loads and before React hydration. Only synchronous work here is
// guaranteed to run before hydration, so keep it tiny: the Faro SDK (~370 KB with the browser
// OpenTelemetry tracing instrumentation) is loaded on idle below, not parsed in the hydration path.
//
// Errors are still captured from the first moment: the bridge queues them (and identity changes)
// and flushes the queue as soon as the SDK registers itself. Faro's web-vitals instrumentation uses
// buffered PerformanceObserver entries, so FCP/LCP/CLS are reported even with a deferred start.
window.addEventListener("error", (event) => pushFaroError(event.error ?? event.message));
window.addEventListener("unhandledrejection", (event) => pushFaroError(event.reason));

// PostHog (product analytics) also waits for idle; page views are its own `$pageview`, and every
// event is tagged with the Faro session so a replay can be followed into Grafana.
initPostHog();

function startFaro(): void {
  void import("./lib/observability/faro")
    .then(({ initFaro }) => {
      initFaro();
      const faroSessionId = getFaroSessionId();
      if (faroSessionId) registerSuperProps({ faro_session_id: faroSessionId });
    })
    .catch(() => undefined);
}

if (typeof window.requestIdleCallback === "function") {
  window.requestIdleCallback(startFaro, { timeout: 2500 });
} else {
  setTimeout(startFaro, 1500);
}

// The initial route is not a client navigation, so record a product view explicitly.
trackProductView(window.location.pathname);

/** App Router navigation hook: a product detail page records a product view. */
export function onRouterTransitionStart(url: string): void {
  trackProductView(url);
}
