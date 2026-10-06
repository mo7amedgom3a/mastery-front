import { trackProductView } from "./lib/observability/behavior";
import { getFaroSessionId, initFaro } from "./lib/observability/faro";
import { initPostHog, registerSuperProps } from "./lib/observability/posthog";

// Runs once, after the document loads and before React hydration: this is what lets Faro capture
// the first errors and web vitals of the session. Only synchronous work here is guaranteed to run
// before hydration, and initializeFaro is synchronous.
initFaro();

// PostHog (product analytics) loads only once the browser is idle, so it never competes with
// hydration. Page views are its own `$pageview`; tagging every event with the Faro session lets a
// replay be followed into Grafana.
initPostHog();
const faroSessionId = getFaroSessionId();
if (faroSessionId) registerSuperProps({ faro_session_id: faroSessionId });

// The initial route is not a client navigation, so record a product view explicitly.
trackProductView(window.location.pathname);

/** App Router navigation hook: a product detail page records a product view. */
export function onRouterTransitionStart(url: string): void {
  trackProductView(url);
}
