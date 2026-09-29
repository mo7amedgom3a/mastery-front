import "server-only";

import { cache } from "react";

import type { CourseDto } from "@/features/landing/model/mappers";
import { getLegacyCourses, getLegacyPackages } from "@/lib/api/legacy";
import { withResolvedPrices } from "@/lib/api/legacy-pricing";
import { cachedRead, valueOf } from "@/lib/api/server-cache";

import type { CatalogIndex } from "../model/types";

/** API maximum page size for legacy lists. */
const PAGE_SIZE = 200;
/** Stops a misbehaving `total` from paging forever. */
const MAX_PAGES = 5;
const CATALOG_REVALIDATE_SECONDS = 300;

/**
 * Every course, diploma and package, keyed for lookup. Recommendation cards carry no artwork, link
 * name or reliable price, so they are rebuilt from these records. The same few cached requests serve
 * every product page (the fetch cache dedupes them across renders).
 */
export const getCatalogIndex = cache(async (): Promise<CatalogIndex> => {
  const options = cachedRead(CATALOG_REVALIDATE_SECONDS, ["catalog-index"]);

  const allCourses = async () => {
    const items: CourseDto[] = [];
    for (let page = 0; page < MAX_PAGES; page++) {
      const result = await getLegacyCourses({ limit: PAGE_SIZE, offset: page * PAGE_SIZE }, options);
      items.push(...result.items);
      if (result.items.length < PAGE_SIZE || items.length >= result.total) break;
    }
    return items;
  };

  const [courses, packages] = await Promise.allSettled([
    allCourses().then((items) => withResolvedPrices(items, options)),
    getLegacyPackages({ limit: PAGE_SIZE }, options).then((page) => page.items),
  ]);

  const index: CatalogIndex = { courses: new Map(), packages: new Map() };
  // `/legacy/courses` lists diplomas too.
  for (const dto of valueOf(courses, "catalog index courses") ?? []) {
    index.courses.set(`${dto.is_diploma ? "diploma" : "course"}:${dto.id}`, dto);
  }
  for (const dto of valueOf(packages, "catalog index packages") ?? []) {
    index.packages.set(`package:${dto.id}`, dto);
  }
  return index;
});
