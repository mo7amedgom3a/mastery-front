import "server-only";

import { getConsultationIndex } from "@/features/consultation-detail/api/get-consultation-index";
import { consultationCard } from "@/features/consultation-detail/model/mappers";
import {
  isPublishable,
  positiveOrNull,
  priceAmounts,
  type CourseDto,
  type PackageDto,
} from "@/features/landing/model/mappers";
import { getCatalogIndex } from "@/features/product-detail/api/get-catalog-index";
import { productCacheTag } from "@/features/product-detail/api/get-product-detail";
import { courseCard, packageCard } from "@/features/product-detail/model/mappers";
import type { RailCardVM } from "@/features/product-detail/model/types";
import { getInstructorNames } from "@/lib/api/instructor-names";
import { getLegacyPackage } from "@/lib/api/legacy";
import { cachedRead, valueOf } from "@/lib/api/server-cache";
import { toPricing, type PriceRow } from "@/lib/pricing";
import { parseShopKey, type ResolveItemsResponse, type ResolvedItem } from "@/lib/shop/contract";

/** Same freshness as the catalog index the prices come from. */
const REVALIDATE_SECONDS = 300;
/** A wishlist or cart larger than this is not a real one. */
export const MAX_RESOLVE_KEYS = 100;

function toResolved(
  key: string,
  card: RailCardVM,
  available: boolean,
  amounts: { current: number | null; original: number | null },
): ResolvedItem {
  // Same rule as the cards (`toPricing`): only an explicit zero is free; no price stays unknown.
  const { free } = toPricing(amounts.current, amounts.original);
  const priceAmount = positiveOrNull(amounts.current);
  return {
    key,
    kind: card.kind,
    id: card.id,
    title: card.title,
    image: card.image,
    href: card.href,
    tag: card.tag,
    instructor: card.instructor,
    duration: card.duration,
    courseCount: card.courseCount,
    available,
    free,
    priceAmount,
    // Only a running offer has an "original": the base price it undercuts.
    originalAmount: priceAmount !== null && amounts.original !== null && amounts.original > priceAmount ? amounts.original : null,
    purchasable: available && !free && card.kind !== "consultation" && priceAmount !== null,
  };
}

/**
 * The catalog's current view of saved or carted items: title, artwork, link, and above all the
 * price that applies now (the offer price while an offer runs). Courses, diplomas and consultations
 * come from the cached catalog indexes every page already shares; a package's price list lives on
 * its detail, so each package is read from there (cached too).
 *
 * Throws when the catalog can't be read: an unreachable API must not look like "these items no
 * longer exist" (the pages would tell the visitor their cart is gone).
 *
 * TODO(api): the B2C cart and wishlist endpoints will return priced items directly.
 */
export async function resolveItems(keys: readonly string[]): Promise<ResolveItemsResponse> {
  const wanted = [...new Set(keys)].slice(0, MAX_RESOLVE_KEYS).flatMap((key) => {
    const parsed = parseShopKey(key);
    return parsed ? [{ key, ...parsed }] : [];
  });
  const missing = new Set(keys.filter((key) => !wanted.some((entry) => entry.key === key)));

  const needs = (...kinds: string[]) => wanted.some((entry) => kinds.includes(entry.kind));
  const packageIds = wanted.filter((entry) => entry.kind === "package").map((entry) => entry.id);
  const read = cachedRead(REVALIDATE_SECONDS, ["catalog-index"]);

  const [catalogResult, consultationsResult, instructorsResult, packagesResult] = await Promise.allSettled([
    needs("course", "diploma", "package") ? getCatalogIndex() : null,
    needs("consultation") ? getConsultationIndex() : null,
    needs("course", "diploma") ? getInstructorNames(read) : null,
    Promise.allSettled(
      packageIds.map((id) => getLegacyPackage(id, cachedRead(REVALIDATE_SECONDS, [productCacheTag("package", id)]))),
    ),
  ]);
  const catalog = valueOf(catalogResult, "catalog index");
  const consultations = valueOf(consultationsResult, "consultation index");
  if ((needs("course", "diploma", "package") && !catalog) || (needs("consultation") && !consultations)) {
    throw new Error("catalog unavailable");
  }
  const instructors = valueOf(instructorsResult, "instructor names") ?? undefined;
  const packageDetails = new Map<number, { collection: PackageDto; prices?: readonly PriceRow[] | null }>();
  (valueOf(packagesResult, "package details") ?? []).forEach((result, index) => {
    // A failed or 404 detail falls back to the catalog row below.
    if (result.status === "fulfilled") packageDetails.set(packageIds[index], result.value);
  });

  const items: ResolvedItem[] = [];
  for (const { key, kind, id } of wanted) {
    if (kind === "consultation") {
      const dto = consultations?.get(id);
      if (dto) {
        items.push(toResolved(key, consultationCard(dto), isPublishable(dto), { current: dto.price ?? null, original: null }));
        continue;
      }
    } else if (kind === "package") {
      const detail = packageDetails.get(id);
      const dto: PackageDto | undefined = detail?.collection ?? catalog?.packages.get(`package:${id}`);
      if (dto) {
        items.push(toResolved(key, packageCard(dto), isPublishable(dto), priceAmounts(dto, detail?.prices ?? undefined)));
        continue;
      }
    } else {
      // Courses and diplomas share one id space; a saved key may carry the kind the item had then.
      const dto: CourseDto | undefined = catalog?.courses.get(`course:${id}`) ?? catalog?.courses.get(`diploma:${id}`);
      if (dto) {
        items.push(toResolved(key, courseCard(dto, instructors), isPublishable(dto), priceAmounts(dto)));
        continue;
      }
    }
    missing.add(key);
  }

  return { items, missing: [...missing] };
}
