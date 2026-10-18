import "server-only";

import { cache } from "react";

import { getCatalogProduct } from "@/lib/api/catalog";
import { ApiError } from "@/lib/api/client";
import { cachedRead, freshRead } from "@/lib/api/server-cache";

import { getProductContent } from "@/lib/api/product-content";

import { mapB2CPackageDetail } from "../model/mappers-b2c";
import type { PackageDetailData } from "../model/types";

/** Keep in sync with the package page's `revalidate`. */
const PACKAGE_REVALIDATE_SECONDS = 300;

/**
 * The B2C package with this numeric id (`b2c.packages` is addressed by the slug `package-{id}`),
 * mapped for the storefront page; null when it doesn't exist. B2C is the source of truth — no legacy
 * read. `preview` (the admin Studio) reads fresh, uncached data so edits show at once.
 */
export const getB2CPackageDetail = cache(
  async (id: number, preview = false): Promise<PackageDetailData | null> =>
    getB2CPackageDetailBySlug(`package-${id}`, id, preview),
);

/** Same, addressed by the B2C product slug (the admin Studio sends the slug). */
export async function getB2CPackageDetailBySlug(
  slug: string,
  id: number,
  preview = false,
): Promise<PackageDetailData | null> {
  const tag = `package-${id}`;
  const options = preview ? freshRead([tag]) : cachedRead(PACKAGE_REVALIDATE_SECONDS, [tag]);
  let dto;
  try {
    dto = await getCatalogProduct(slug, options);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
  // The page published from the Course Studio (404 when there is none).
  const content = await getProductContent(dto.product.product_id, options).catch(() => null);
  return mapB2CPackageDetail(dto, id, content);
}
