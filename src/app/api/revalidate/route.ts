import { timingSafeEqual } from "node:crypto";

import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

import { LANDING_CACHE_TAG } from "@/features/landing/api/get-landing-data";
import { CATALOG_CACHE_TAG } from "@/lib/api/server-cache";

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
 * On-demand refresh of catalog data (e.g. called by the admin/CMS after publishing). Refreshes the
 * landing page and every course/diploma/package/consultation page; `?tag=course-4` (or `package-1`, `consultation-2`, `expert-9`, `bundle-{slug}`,
 * `live-trainings` for the `/live` pages)
 * refreshes one product page only.
 * `curl -X POST -H "x-revalidate-secret: $REVALIDATE_SECRET" https://…/api/revalidate`
 */
export async function POST(request: NextRequest) {
  if (!isAuthorized(request.headers.get("x-revalidate-secret"))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const tag = request.nextUrl.searchParams.get("tag");
  const tags = tag && /^(?:catalog|landing|live-trainings|(?:course|diploma|package|consultation|expert|bundle)-[a-z0-9-]{1,200})$/.test(tag) ? [tag] : [LANDING_CACHE_TAG, CATALOG_CACHE_TAG];
  // Called by the admin right after an edit: expire at once so the very next visit shows it.
  for (const item of tags) revalidateTag(item, { expire: 0 });
  return NextResponse.json({ ok: true, revalidated: tags });
}
