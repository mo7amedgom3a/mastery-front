import { timingSafeEqual } from "node:crypto";

import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

import { LANDING_CACHE_TAG } from "@/features/landing/api/get-landing-data";

function isAuthorized(provided: string | null): boolean {
  const expected = process.env.REVALIDATE_SECRET;
  if (!expected || !provided) {
    return false;
  }
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * On-demand refresh of the landing page data (e.g. called by the admin/CMS after publishing).
 * `curl -X POST -H "x-revalidate-secret: $REVALIDATE_SECRET" https://…/api/revalidate`
 */
export async function POST(request: NextRequest) {
  if (!isAuthorized(request.headers.get("x-revalidate-secret"))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  revalidateTag(LANDING_CACHE_TAG, "max");
  return NextResponse.json({ ok: true, revalidated: [LANDING_CACHE_TAG] });
}
