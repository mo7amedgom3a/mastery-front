import { NextResponse, type NextRequest } from "next/server";

import { getSearchRecommendations } from "@/features/search/api/get-recommendations";

/** Same shape the browser generates (see `lib/customer-tracking`). */
const FINGERPRINT_PATTERN = /^[A-Za-z0-9_-]{16,128}$/;

/**
 * The recommendation rail's data, for the browser that asks. The page itself can't render it: the
 * visitor's fingerprint lives in their browser, and the cards need the server's catalog index. So
 * the rail calls this once it is on screen, passing the fingerprint; the session cookie rides along.
 */
export async function GET(request: NextRequest) {
  const fingerprint = request.headers.get("x-client-fingerprint");
  const data = await getSearchRecommendations({
    fingerprint: fingerprint && FINGERPRINT_PATTERN.test(fingerprint) ? fingerprint : null,
    accessToken: request.cookies.get("b2c_access_token")?.value ?? null,
  });
  // Per visitor: never stored by a shared cache.
  return NextResponse.json(data, { headers: { "Cache-Control": "private, no-store" } });
}
