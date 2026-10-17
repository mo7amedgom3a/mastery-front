import { NextResponse } from "next/server";

import { verifyIntroVideo } from "@/features/product-detail/api/intro-video";
import { introVideoSource } from "@/features/product-detail/model/mappers-b2c";
import { getCatalogProduct } from "@/lib/api/catalog";
import { ApiError } from "@/lib/api/client";
import { freshRead } from "@/lib/api/server-cache";

const SLUG = /^(course|diploma)-(\d+)$/;

/**
 * The B2C course/diploma for the admin Studio's live preview, read fresh (uncached) so an edit shows at
 * once. The Studio overlays its unsaved document on it in the browser (`CoursePreview`).
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const slug = params.get("slug") ?? "";
  // The Studio's unsaved intro video id; empty keeps the product's own.
  const video = params.get("video")?.trim() || null;
  if (!SLUG.test(slug)) {
    return NextResponse.json({ error: "bad product slug" }, { status: 400 });
  }
  try {
    const dto = await getCatalogProduct(slug, freshRead([slug]));
    const source = introVideoSource({ ...dto, intro_video_id: video ?? dto.intro_video_id }, null);
    const introVideo = await verifyIntroVideo(source, true);
    return NextResponse.json({ dto, introVideo }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return NextResponse.json({ error: "product not found" }, { status: 404 });
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
