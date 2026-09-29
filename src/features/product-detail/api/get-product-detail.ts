import "server-only";

import { cache } from "react";

import { getBunnyConfig } from "@/config/env";
import { ApiError } from "@/lib/api/client";
import { getLegacyCourse, getLegacyRelatedResources, getLegacyResourceRecommendations } from "@/lib/api/legacy";
import { getInstructorNames } from "@/lib/api/instructor-names";
import { withResolvedPrices } from "@/lib/api/legacy-pricing";
import { cachedRead, valueOf } from "@/lib/api/server-cache";

import { introVideoSource, kindOf, MAX_RAIL_CARDS, mapProductDetailData } from "../model/mappers";
import type { IntroVideoSource, IntroVideoVM, ProductDetailData } from "../model/types";
import { getCatalogIndex } from "./get-catalog-index";

/** Keep in sync with the detail pages' `revalidate`. */
const PRODUCT_REVALIDATE_SECONDS = 300;

/** Per-product cache tag, e.g. `course-4`; `POST /api/revalidate?tag=course-4` refreshes one page. */
export function productCacheTag(kind: string, id: number): string {
  return `${kind}-${id}`;
}

/**
 * The course or diploma with this legacy id, plus its related and recommended rails; null when it
 * doesn't exist. `/legacy/courses/{id}` serves diplomas too, so one endpoint covers both routes and
 * the caller redirects when the kind doesn't match the URL.
 *
 * The rails load after the detail (they need its kind) and fail independently: a failed rail is
 * simply left off the page. A failed detail request throws, so ISR keeps serving the last good page.
 */
export const getProductDetail = cache(async (id: number): Promise<ProductDetailData | null> => {
  let detail;
  try {
    // Courses and diplomas share one id space and the kind isn't known yet: tag both.
    const tags = [productCacheTag("course", id), productCacheTag("diploma", id)];
    detail = await getLegacyCourse(id, cachedRead(PRODUCT_REVALIDATE_SECONDS, tags));
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }

  const kind = kindOf(detail);
  const path = { resource_type: kind, legacy_id: id };
  const options = cachedRead(PRODUCT_REVALIDATE_SECONDS, [productCacheTag(kind, id)]);
  // Ask for a few extra: cards without artwork, duplicates and the product itself are dropped.
  const limit = MAX_RAIL_CARDS + 4;
  const [related, recommendations, catalog, instructors, introVideo] = await Promise.allSettled([
    getLegacyRelatedResources(path, { limit }, options).then(async (page) => ({
      ...page,
      courses: await withResolvedPrices(page.courses ?? [], options),
      diplomas: await withResolvedPrices(page.diplomas ?? [], options),
    })),
    getLegacyResourceRecommendations(path, { limit }, options),
    getCatalogIndex(),
    // Shared across every product page, like the catalog index.
    getInstructorNames(cachedRead(PRODUCT_REVALIDATE_SECONDS, ["catalog-index"])),
    verifyIntroVideo(introVideoSource(detail)),
  ]);

  const data = mapProductDetailData({
    detail,
    related: valueOf(related, `${kind} ${id} related`),
    recommendations: valueOf(recommendations, `${kind} ${id} recommendations`),
    catalog: valueOf(catalog, "catalog index"),
    instructors: valueOf(instructors, "instructor names"),
  });
  data.product.introVideo = valueOf(introVideo, `${kind} ${id} intro video`);
  return data;
});

/**
 * The promo video as a Bunny iframe, or null when it can't play: no library configured, or the video
 * isn't in the library. Bunny's embed page answers 200 even for a missing video (it renders its own
 * "404"), so existence is checked on the library's CDN instead, where the playlist is a clean 200/404.
 * Visitors never see a broken or "not found" player; the section is simply left out.
 */
async function verifyIntroVideo(source: IntroVideoSource | null): Promise<IntroVideoVM | null> {
  const bunny = getBunnyConfig();
  if (!source || !bunny) {
    return null;
  }
  const base = `https://${bunny.cdnHostname}/${source.videoId}`;
  if (!(await isReachable(`${base}/playlist.m3u8`))) {
    return null;
  }
  return {
    embedUrl: `https://player.mediadelivery.net/embed/${bunny.libraryId}/${source.videoId}`,
    poster: `${base}/thumbnail.jpg`,
    title: source.title,
    duration: source.duration,
  };
}

/**
 * Whether the URL answers 2xx. Cached like the page (a GET, so ISR stays static); a slow CDN counts
 * as unreachable rather than holding the page render.
 */
async function isReachable(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      next: { revalidate: PRODUCT_REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(3000),
    });
    return response.ok;
  } catch {
    return false;
  }
}
