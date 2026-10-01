import "server-only";

import type { Route } from "next";
import { cache } from "react";

import { tagName } from "@/features/search/content/copy";
import { baseOptionsApiParams, emptySearchState, searchHref } from "@/features/search/model/params";
import { getSearchOptions } from "@/lib/api/search";
import { cachedRead } from "@/lib/api/server-cache";

export type CatalogChipVM = { code: string; label: string; count: number; href: Route };

export type BusinessCatalogVM = {
  categories: CatalogChipVM[];
  tags: CatalogChipVM[];
};

/** Tags that describe the product format rather than a topic. */
const NON_TOPIC_TAGS = new Set(["consultation"]);
const MAX_TAGS = 16;

// Same request (params and cache options) as the search page's facet vocabulary, so they share one cache entry.
const read = cachedRead(600, ["search"]);

/**
 * Categories and topic tags that have products, biggest first, each linking to its search listing.
 * Empty when the API is down, so the page still renders.
 */
export const getBusinessCatalog = cache(async (): Promise<BusinessCatalogVM> => {
  try {
    const options = await getSearchOptions(baseOptionsApiParams, read);
    const chips = (items: typeof options.categories, facet: "categories" | "tags", label: (code: string, name: string) => string) =>
      items
        .filter((item) => item.count > 0)
        .toSorted((a, b) => b.count - a.count)
        .map((item) => {
          const code = item.code.toLowerCase();
          return {
            code,
            label: label(code, item.name?.trim() || code),
            count: item.count,
            href: searchHref({ ...emptySearchState, [facet]: [code] }),
          };
        });
    return {
      categories: chips(options.categories, "categories", (_code, name) => name),
      tags: chips(
        options.tags.filter((tag) => !NON_TOPIC_TAGS.has(tag.code.toLowerCase())),
        "tags",
        (code, name) => tagName(code, name),
      ).slice(0, MAX_TAGS),
    };
  } catch (error) {
    console.error("[api] business catalog request failed", error);
    return { categories: [], tags: [] };
  }
});
