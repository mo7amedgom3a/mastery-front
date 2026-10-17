import { NextResponse } from "next/server";

import { getSiteUrl } from "@/config/env";
import { routes } from "@/config/routes";
import { toQrMatrix } from "@/features/product-detail/api/share-qr";
import { getCatalogProduct } from "@/lib/api/catalog";
import { ApiError } from "@/lib/api/client";
import { freshRead } from "@/lib/api/server-cache";

/**
 * The B2C package for the admin Studio's live preview, read fresh (uncached) so an edit shows at once.
 * It returns the raw product plus the share QR; the Studio's unsaved document and README are laid over it in
 * the browser (`PackagePreview`), so typing never waits on this request.
 */
export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get("slug") ?? "";
  const match = slug.match(/(\d+)\s*$/);
  const id = match ? Number(match[1]) : Number.NaN;
  if (!Number.isSafeInteger(id) || id <= 0) {
    return NextResponse.json({ error: "bad package slug" }, { status: 400 });
  }
  try {
    const dto = await getCatalogProduct(slug, freshRead([`package-${id}`]));
    const shareUrl = `${getSiteUrl()}${routes.package(id)}`;
    const qr = toQrMatrix(`${shareUrl}?utm_source=qr&utm_medium=share`);
    return NextResponse.json({ dto, qr }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return NextResponse.json({ error: "package not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? `${error.name}: ${error.message}` : String(error) },
      { status: 500 },
    );
  }
}
