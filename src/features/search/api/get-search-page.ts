import "server-only";

import { cache } from "react";

import type { ApiRequestOptions } from "@/lib/api/client";
import { getSearchOptions, searchProducts } from "@/lib/api/search";
import { cachedRead, valueOf } from "@/lib/api/server-cache";

import { emptyCatalog, mapActiveFilters, mapCatalog, mapFacets, mapResults } from "../model/mappers";
import {
  baseOptionsApiParams,
  hasFilters,
  isCacheableState,
  keepKnownFacets,
  parseSearchParams,
  toOptionsApiParams,
  toSearchApiParams,
  type RawSearchParams,
  type SearchState,
} from "../model/params";
import type { SearchCatalog, SearchViewData } from "../model/types";

/** Cache tag for on-demand refresh; `cachedRead` also adds the shared catalog tag. */
const SEARCH_CACHE_TAG = "search";
const CATALOG_REVALIDATE_SECONDS = 600;
const RESULTS_REVALIDATE_SECONDS = 300;

const catalogRead = cachedRead(CATALOG_REVALIDATE_SECONDS, [SEARCH_CACHE_TAG]);
const resultsRead = cachedRead(RESULTS_REVALIDATE_SECONDS, [SEARCH_CACHE_TAG]);
/** Free-form searches are never stored: their key space is unbounded. */
const uncachedRead: ApiRequestOptions = { cache: "no-store" };

/**
 * The facet vocabulary (every category, skill, tag and trainer). One cached request shared by the
 * page, its metadata and the sitemap; an empty catalog when the API is down, so the page still renders.
 */
export const getSearchCatalog = cache(async (): Promise<SearchCatalog> => {
  try {
    return mapCatalog(await getSearchOptions(baseOptionsApiParams, catalogRead));
  } catch (error) {
    console.error("[api] search options request failed", error);
    return emptyCatalog;
  }
});

/** Filters for a URL, with facet values the catalog doesn't know removed. */
export async function resolveSearchState(raw: RawSearchParams): Promise<{ state: SearchState; catalog: SearchCatalog }> {
  const catalog = await getSearchCatalog();
  const parsed = parseSearchParams(raw);
  // With no catalog (API down) values can't be checked; they were already shape-checked.
  const state = catalog === emptyCatalog ? parsed : keepKnownFacets(parsed, catalog.known);
  return { state, catalog };
}

/**
 * Results and facet counts for a state, requested in parallel. Each fails on its own: without
 * results the page says so, without counts the chips fall back to the full vocabulary.
 */
export async function getSearchView(state: SearchState, catalog: SearchCatalog): Promise<SearchViewData> {
  const read = isCacheableState(state) ? resultsRead : uncachedRead;
  const [results, options] = await Promise.allSettled([
    searchProducts(toSearchApiParams(state), read),
    // Unfiltered counts are the catalog request's own; only a narrowed scope needs another one.
    hasFilters(state) ? getSearchOptions(toOptionsApiParams(state), read) : getSearchOptions(baseOptionsApiParams, catalogRead),
  ]);

  const response = valueOf(results, "search");
  const counts = valueOf(options, "search facet counts");
  return {
    state,
    facets: mapFacets(state, catalog, counts),
    countsKnown: counts !== null,
    activeFilters: mapActiveFilters(state, catalog),
    results: response ? mapResults(response, catalog) : null,
  };
}
