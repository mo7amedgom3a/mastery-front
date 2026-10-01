import "server-only";

import type { NextRequest } from "next/server";

import type { ApiRequestOptions } from "@/lib/api/client";

/** Same shape the browser generates (see `lib/customer-tracking`). */
const FINGERPRINT_PATTERN = /^[A-Za-z0-9_-]{16,128}$/;
/** The legacy sign-in calls behind the backend may take up to 30s. */
const BACKEND_TIMEOUT_MS = 35_000;

/**
 * Headers for a backend call made on a visitor's behalf. The backend limits and audits requests
 * per client, and would otherwise see every visitor as this server.
 */
export function backendHeaders(request: NextRequest, accessToken?: string | null): Headers {
  const headers = new Headers();
  for (const name of ["x-forwarded-for", "user-agent", "accept-language"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  const fingerprint = request.headers.get("x-client-fingerprint");
  if (fingerprint && FINGERPRINT_PATTERN.test(fingerprint)) headers.set("X-Client-Fingerprint", fingerprint);
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  return headers;
}

/** Options for the `lib/api/auth` functions when a route handler calls them. */
export function backendOptions(request: NextRequest, accessToken?: string | null): Omit<ApiRequestOptions, "body" | "credentials"> {
  return {
    headers: backendHeaders(request, accessToken),
    cache: "no-store",
    signal: AbortSignal.timeout(BACKEND_TIMEOUT_MS),
  };
}
