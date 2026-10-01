import { ApiError, apiRequest } from "@/lib/api/client";
import { getClientFingerprint } from "@/lib/customer-tracking";

import type { AuthCustomer, CodeSentResponse, CustomerResponse, SessionResponse } from "./contract";

/**
 * Browser client for this app's auth endpoints (`/api/auth/*`). They keep the session in httpOnly
 * cookies and talk to the backend themselves, so no token is ever handed to the page.
 */
const paths = {
  register: "/api/auth/register",
  login: "/api/auth/login",
  resend: "/api/auth/resend",
  verify: "/api/auth/verify",
  refresh: "/api/auth/refresh",
  logout: "/api/auth/logout",
  session: "/api/auth/session",
} as const;

/** Every tab of this browser shares one refresh token; this lock lets one tab rotate it at a time. */
const REFRESH_LOCK = "mastery-auth-refresh";

export type RegisterPayload = {
  fullname: string;
  email: string;
  phone: string | null;
  password: string;
  repassword: string;
  acceptterms: boolean;
};

function request<T>(method: "GET" | "POST", path: string, body?: unknown): Promise<T> {
  return apiRequest<T>(method, path, {
    sameOrigin: true,
    body,
    // Passed on to the backend, which limits sign-in attempts per browser.
    context: { clientFingerprint: getClientFingerprint() },
  });
}

export function registerAccount(payload: RegisterPayload): Promise<{ registered: true }> {
  return request("POST", paths.register, payload);
}

/** Step one of signing in: asks for a code to be emailed to `loginName`. */
export function requestLoginCode(loginName: string): Promise<CodeSentResponse> {
  return request("POST", paths.login, { loginName });
}

export function resendLoginCode(): Promise<CodeSentResponse> {
  return request("POST", paths.resend);
}

/** Step two: the emailed code. Starts the session. */
export async function verifyLoginCode(code: string): Promise<AuthCustomer> {
  return (await request<CustomerResponse>("POST", paths.verify, { code })).customer;
}

export function getSession(): Promise<SessionResponse> {
  return request("GET", paths.session);
}

export function signOut(): Promise<void> {
  return request("POST", paths.logout);
}

const sessionLostListeners = new Set<() => void>();

/** Called when a refresh finds the session is over (expired, revoked, or signed out elsewhere). */
export function onSessionLost(listener: () => void): () => void {
  sessionLostListeners.add(listener);
  return () => sessionLostListeners.delete(listener);
}

async function refresh(): Promise<AuthCustomer | null> {
  // Another tab may have renewed the session while this one waited for the lock: its old refresh
  // token would now be refused, and that refusal would sign the browser out.
  const session = await getSession();
  if (session.customer) return session.customer;
  if (!session.refreshable) return null;
  try {
    return (await request<CustomerResponse>("POST", paths.refresh)).customer;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
}

let refreshing: Promise<AuthCustomer | null> | null = null;

/**
 * Renews the session with the refresh token; null when there is no session left. The backend
 * replaces the refresh token on every use, so callers share one attempt, in this tab and across tabs.
 */
export function refreshOnce(): Promise<AuthCustomer | null> {
  refreshing ??= (async () => {
    try {
      const customer = await (typeof navigator !== "undefined" && navigator.locks
        ? navigator.locks.request(REFRESH_LOCK, refresh)
        : refresh());
      if (!customer) sessionLostListeners.forEach((listener) => listener());
      return customer;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}
