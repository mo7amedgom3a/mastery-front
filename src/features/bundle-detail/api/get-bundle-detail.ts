import "server-only";

import { cache } from "react";

import { getCatalogProduct, type CatalogBundleDetail } from "@/lib/api/catalog";
import { ApiError } from "@/lib/api/client";
import { getProductContent } from "@/lib/api/product-content";
import { cachedRead, productCacheTag, valueOf } from "@/lib/api/server-cache";

import { isPublishedBundle, mapBundleDetail, parseMember, type MemberSource } from "../model/mappers";
import type { BundleDetailVM } from "../model/types";

/** Keep in sync with the bundle page's `revalidate`. */
const BUNDLE_REVALIDATE_SECONDS = 300;

export function bundleCacheTag(slug: string): string {
  return `bundle-${slug}`;
}

/** A catalog bundle by slug; null when it doesn't exist, isn't a bundle or isn't published. */
export async function getCatalogBundle(slug: string, revalidate: number, tags: string[]): Promise<CatalogBundleDetail | null> {
  try {
    const detail: CatalogBundleDetail = await getCatalogProduct(slug, cachedRead(revalidate, [bundleCacheTag(slug), ...tags]));
    return isPublishedBundle(detail.product) ? detail : null;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

/** The B2C product behind one member, for its artwork, trainers, outline and own price. */
function memberSource(member: CatalogBundleDetail["bundle_members"][number]): Promise<MemberSource> {
  const { kind, id } = parseMember(member);
  if (id === null) {
    return Promise.resolve(null);
  }
  if (kind === "course" || kind === "diploma") {
    // Courses and diplomas share one id space: tag both, like the course page does.
    const options = cachedRead(BUNDLE_REVALIDATE_SECONDS, [productCacheTag("course", id), productCacheTag("diploma", id)]);
    return getCatalogProduct(member.slug, options).then((detail) => ({ type: "course", id, detail }));
  }
  if (kind === "consultation") {
    const options = cachedRead(BUNDLE_REVALIDATE_SECONDS, [productCacheTag("consultation", id)]);
    return getCatalogProduct(member.slug, options).then((detail) => ({ type: "consultation", detail }));
  }
  if (kind === "package") {
    const options = cachedRead(BUNDLE_REVALIDATE_SECONDS, [productCacheTag("package", id)]);
    return getCatalogProduct(member.slug, options).then((detail) => ({ type: "package", detail }));
  }
  return Promise.resolve(null);
}

/**
 * The bundle with this slug and its members, each enriched from its own B2C product. A member
 * whose detail fails keeps its catalog title and type. A failed bundle request throws, so ISR keeps
 * serving the last good page.
 */
export const getBundleDetail = cache(async (slug: string): Promise<BundleDetailVM | null> => {
  const detail = await getCatalogBundle(slug, BUNDLE_REVALIDATE_SECONDS, []);
  if (!detail) {
    return null;
  }
  const results = await Promise.allSettled(detail.bundle_members.map(memberSource));
  const sources = results.map((result, index) => valueOf(result, `bundle ${slug} member ${detail.bundle_members[index].slug}`));
  // The page published from the admin Studio (404 when there is none).
  const content = await getProductContent(
    detail.product.product_id,
    cachedRead(BUNDLE_REVALIDATE_SECONDS, [bundleCacheTag(slug)]),
  ).catch(() => null);
  return mapBundleDetail(detail, sources, content);
});
