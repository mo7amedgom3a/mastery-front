import "server-only";

import { cache } from "react";

import { cardToCourseDto, cardToPackageDto, getAllCatalogCards } from "@/lib/api/browse";
import { cachedRead, valueOf } from "@/lib/api/server-cache";

import type { CatalogIndex } from "../model/types";

const CATALOG_REVALIDATE_SECONDS = 300;

/**
 * Every published course, diploma and package, keyed for lookup. Recommendation cards carry no artwork,
 * link name or reliable price, so they are rebuilt from these records. The same few cached requests serve
 * every product page (the fetch cache dedupes them across renders).
 */
export const getCatalogIndex = cache(async (): Promise<CatalogIndex> => {
  const options = cachedRead(CATALOG_REVALIDATE_SECONDS, ["catalog-index"]);
  const [courses, packages] = await Promise.allSettled([
    getAllCatalogCards({ product_type: ["course", "diploma"] }, options),
    getAllCatalogCards({ product_type: ["package"] }, options),
  ]);

  const index: CatalogIndex = { courses: new Map(), packages: new Map() };
  for (const card of valueOf(courses, "catalog index courses") ?? []) {
    const dto = cardToCourseDto(card);
    if (dto) index.courses.set(`${dto.is_diploma ? "diploma" : "course"}:${dto.id}`, dto);
  }
  for (const card of valueOf(packages, "catalog index packages") ?? []) {
    const dto = cardToPackageDto(card);
    if (dto) index.packages.set(`package:${dto.id}`, dto);
  }
  return index;
});
