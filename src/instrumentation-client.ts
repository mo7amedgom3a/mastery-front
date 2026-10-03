import { trackPageView } from "./lib/observability/behavior";
import { initFaro } from "./lib/observability/faro";

// Runs once, after the document loads and before React hydration: this is what lets Faro capture
// the first errors and web vitals of the session. Only synchronous work here is guaranteed to run
// before hydration, and initializeFaro is synchronous.
initFaro();

// The initial route is not a client navigation, so record it explicitly.
trackPageView({ url: window.location.pathname, navigationType: "load" });

/**
 * App Router navigation hook. Feeds each route change to Faro as a `page_view` (with the route
 * pattern and, on a detail page, the product it addresses) and reports product views to the
 * backend.
 */
export function onRouterTransitionStart(
  url: string,
  navigationType: "push" | "replace" | "traverse",
): void {
  trackPageView({ url, navigationType });
}
