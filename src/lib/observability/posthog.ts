import type { PostHog } from "posthog-js";

/**
 * PostHog (product analytics: events, funnels, session replay, heatmaps) lives behind this module.
 * It is the non-technical counterpart to Faro: Faro keeps errors, web vitals and traces for
 * engineers; PostHog gets the business events the product team asks questions about.
 *
 * The SDK is loaded lazily (dynamic import once the browser is idle), so it never sits in the
 * hydration bundle and cannot delay LCP or interactivity. Calls made before it loads are queued and
 * replayed in order. Like Faro, everything is best-effort: analytics must never break the app.
 */
let posthog: PostHog | undefined;
let started = false;
let queue: Array<(client: PostHog) => void> = [];

// Crawlers and headless browsers get the same server-rendered HTML but never download analytics.
const BOT_PATTERN =
  /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|embedly|quora link preview|whatsapp|telegram|lighthouse|headless|prerender/i;

function isBot(): boolean {
  return navigator.webdriver === true || BOT_PATTERN.test(navigator.userAgent);
}

function readToken(): string | null {
  return process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN?.trim() || null;
}

// The ingestion host is reached through the same-origin `/ingest` rewrite (see next.config.ts); the
// UI host is only used for links PostHog builds (toolbar, replay URLs).
function uiHost(): string {
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() || "https://us.i.posthog.com";
  return host.includes("eu.") ? "https://eu.posthog.com" : "https://us.posthog.com";
}

function run(action: (client: PostHog) => void): void {
  if (posthog) {
    try {
      action(posthog);
    } catch {
      // Analytics failures are never surfaced to the visitor.
    }
    return;
  }
  if (started) queue.push(action);
}

function onIdle(callback: () => void): void {
  if ("requestIdleCallback" in window) window.requestIdleCallback(callback, { timeout: 4000 });
  else setTimeout(callback, 2000);
}

/**
 * Starts PostHog once the browser is idle. Called from `instrumentation-client.ts`. No-ops when
 * `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` is unset or the visitor is a bot.
 */
export function initPostHog(): void {
  if (started || typeof window === "undefined") return;
  const token = readToken();
  if (!token || isBot()) return;
  started = true;

  onIdle(() => {
    import("posthog-js")
      .then(({ default: client }) => {
        client.init(token, {
          api_host: "/ingest",
          ui_host: uiHost(),
          defaults: "2026-08-30",
          // $pageview / $pageleave on every App Router navigation; web analytics and heatmaps use them.
          capture_pageview: "history_change",
          autocapture: true,
          enable_heatmaps: true,
          // Errors and web vitals belong to Faro; don't duplicate them here.
          capture_exceptions: false,
          capture_performance: false,
          person_profiles: "identified_only",
          persistence: "localStorage+cookie",
          // No consent banner yet: record everyone, but never the text or values they see or type.
          session_recording: { maskAllInputs: true, maskTextSelector: "*" },
        });
        posthog = client;
        const pending = queue;
        queue = [];
        pending.forEach(run);
      })
      .catch(() => {
        started = false;
        queue = [];
      });
  });
}

/** Captures a business event; queued until PostHog loads, dropped when it is not configured. */
export function captureEvent(name: string, properties?: Record<string, unknown>): void {
  const clean = properties
    ? Object.fromEntries(Object.entries(properties).filter(([, value]) => value !== undefined && value !== null))
    : undefined;
  run((client) => client.capture(name, clean));
}

/**
 * Signed-in visitors are identified by their opaque customer id (no PII); `null` on sign-out resets
 * to a fresh anonymous id so the next visitor on the device is not merged into the last one.
 */
export function identifyCustomer(customerId: string | null): void {
  run((client) => {
    if (customerId) {
      if (client.get_distinct_id() !== customerId) client.identify(customerId);
    } else if (client._isIdentified()) {
      client.reset();
    }
  });
}

/** Properties sent with every subsequent event (e.g. the Faro session id, to jump from replay to RUM). */
export function registerSuperProps(properties: Record<string, string>): void {
  run((client) => client.register(properties));
}
