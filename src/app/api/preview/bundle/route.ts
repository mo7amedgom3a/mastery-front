import { NextResponse } from "next/server";

import { getBundleDetail } from "@/features/bundle-detail/api/get-bundle-detail";
import { toQrMatrix } from "@/features/product-detail/api/share-qr";
import { getSiteUrl } from "@/config/env";
import { routes } from "@/config/routes";

/** Published bundle data for the Studio iframe; draft page edits are overlaid in the browser. */
export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get("slug") ?? "";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 260) {
    return NextResponse.json({ error: "bad bundle slug" }, { status: 400 });
  }
  try {
    const bundle = await getBundleDetail(slug);
    const qr = toQrMatrix(`${getSiteUrl()}${routes.bundle(slug)}?utm_source=qr&utm_medium=share`);
    return NextResponse.json({ bundle, qr }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "bundle unavailable" }, { status: 500 });
  }
}
