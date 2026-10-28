import { NextResponse } from "next/server";

import { getApiBaseUrl } from "@/config/env";

const CODE_PATTERN = /^[A-Za-z0-9-]{4,40}$/;

/** Public image of a valid certificate (verification page); revoked and unknown codes are 404. */
export async function GET(_request: Request, context: RouteContext<"/api/certificates/verify/[code]/image">) {
  const { code } = await context.params;
  if (!CODE_PATTERN.test(code)) return new NextResponse(null, { status: 404 });
  try {
    const upstream = await fetch(`${getApiBaseUrl()}/certificates/verify/${encodeURIComponent(code)}/image.png`, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(30_000),
    });
    if (!upstream.ok || !upstream.body) return new NextResponse(null, { status: upstream.status === 404 ? 404 : 502 });
    return new NextResponse(upstream.body, {
      headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=300, s-maxage=300" },
    });
  } catch (error) {
    console.error("[verify] certificate image failed", code, error);
    return new NextResponse(null, { status: 502 });
  }
}
