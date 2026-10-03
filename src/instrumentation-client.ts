import { initFaro, trackFaroNavigation } from "./lib/observability/faro";

// Runs once, after the document loads and before React hydration: this is what lets Faro capture
// the first errors and web vitals of the session. Only synchronous work here is guaranteed to run
// before hydration, and initializeFaro is synchronous.
initFaro();

/**
 * App Router navigation hook. Feeds each client-side transition to Faro's event stream; route
 * changes are also visible as history entries through Faro's built-in navigations instrumentation.
 */
export function onRouterTransitionStart(
  url: string,
  navigationType: "push" | "replace" | "traverse",
): void {
  trackFaroNavigation(url, navigationType);
}
