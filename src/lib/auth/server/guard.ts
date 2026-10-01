import "server-only";

import type { NextRequest, NextResponse } from "next/server";

import { authError } from "./respond";

/**
 * Whether a request was started by one of this site's own pages. Session cookies ride along with
 * requests from anywhere, so every handler that changes something checks this first (CSRF).
 */
function isSameOrigin(request: NextRequest): boolean {
  // Set by the browser itself; a page can't forge it.
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite) return fetchSite === "same-origin";

  const origin = request.headers.get("origin");
  // Behind a reverse proxy the request URL is the internal one; the forwarded host is the public one.
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/** A ready 403 for a request another site started; null when the request is this site's own. */
export function rejectCrossOrigin(request: NextRequest): NextResponse | null {
  return isSameOrigin(request) ? null : authError(403, "forbidden", "الطلب غير مسموح به.");
}
