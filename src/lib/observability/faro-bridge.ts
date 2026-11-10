import { getClientFingerprint } from "@/lib/customer-tracking";

/**
 * Lightweight bridge to the Grafana Faro SDK.
 *
 * The SDK (plus the browser OpenTelemetry tracing instrumentation) is ~370 KB of JavaScript in the
 * client entry, and it used to be imported statically from `instrumentation-client.ts`, both error
 * boundaries and the shop auth bridge — i.e. every route paid for it before hydration. This module
 * has no `@grafana` imports: the SDK is loaded on idle by `instrumentation-client.ts` and registers
 * itself here. Identity and early errors are queued and flushed on registration, so deferring the
 * SDK does not lose the first seconds of error reporting.
 */

type FaroHandle = {
  setUser: (id: string) => void;
  resetUser: () => void;
  pushError: (error: Error, context?: Record<string, string>) => void;
  sessionId: () => string | undefined;
};

/** Errors buffered before the SDK loads. Bounded: a broken page must not grow memory. */
const MAX_PENDING_ERRORS = 20;

let handle: FaroHandle | null = null;
let pendingUserId: string | null | undefined;
let pendingErrors: { error: Error; context?: Record<string, string> }[] = [];

/** Called by the SDK module once `initializeFaro` has run. Flushes queued identity and errors. */
export function bindFaro(next: FaroHandle): void {
  handle = next;
  if (pendingUserId !== undefined) {
    applyUser(pendingUserId);
    pendingUserId = undefined;
  }
  const errors = pendingErrors;
  pendingErrors = [];
  for (const { error, context } of errors) {
    handle.pushError(error, context);
  }
}

function applyUser(id: string | null): void {
  if (!handle) return;
  if (id) handle.setUser(id);
  else handle.resetUser();
}

/**
 * Attaches the visitor to every subsequent signal. Signed-in visitors are keyed by their opaque
 * customer id; guests fall back to the random `clientFingerprint` already kept in localStorage, so
 * anonymous browsing can still be followed across pages without any PII.
 */
export function syncFaroIdentity(customerId?: string | null): void {
  if (typeof window === "undefined") return;
  const id = customerId ?? getClientFingerprint() ?? null;
  if (!handle) {
    pendingUserId = id;
    return;
  }
  applyUser(id);
}

/** Reports a caught error (e.g. a React error boundary) to Faro, queued until the SDK is ready. */
export function pushFaroError(error: unknown, context?: Record<string, string>): void {
  if (typeof window === "undefined") return;
  const value = error instanceof Error ? error : new Error(String(error));
  if (handle) {
    handle.pushError(value, context);
    return;
  }
  if (pendingErrors.length < MAX_PENDING_ERRORS) pendingErrors.push({ error: value, context });
}

/** The current Faro session id, so product analytics can link a replay to its RUM session. */
export function getFaroSessionId(): string | undefined {
  return handle?.sessionId();
}
