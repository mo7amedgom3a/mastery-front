import type { Route } from "next";

import type { RailCardVM } from "@/features/product-detail/model/types";

import type { KnownFacets, SearchState } from "./params";

/** View models: what the search page renders. Mapped from API DTOs in `mappers.ts`, never used raw. */

export type FacetKey = "type" | "category" | "skill" | "tag";

export type FacetOptionVM = {
  code: string;
  label: string;
  /** Products this option would list with the other filters as they are. */
  count: number;
  selected: boolean;
  /** The search with this option switched on (or off, when selected). */
  href: Route;
  /** The target is a listing search engines may index; other combinations are marked nofollow. */
  indexable: boolean;
};

export type FacetGroupVM = {
  key: FacetKey;
  label: string;
  /** Shown in the chip row. */
  options: FacetOptionVM[];
  /** Behind "show more". */
  more: FacetOptionVM[];
};

export type TrainerOptionVM = {
  id: number;
  name: string;
  /** Catalog products this trainer teaches. */
  count: number;
};

export type ActiveFilterVM = {
  key: string;
  label: string;
  /** The search without this filter. */
  href: Route;
};

export type CardTagVM = { label: string; href: Route };

export type ResultCardVM = RailCardVM & { tags: CardTagVM[] };

/** The catalog's facet vocabulary: what exists, what it is called, who teaches. */
export type SearchCatalog = {
  known: KnownFacets;
  categoryNames: ReadonlyMap<string, string>;
  skillNames: ReadonlyMap<string, string>;
  tagNames: ReadonlyMap<string, string>;
  /** How many products carry each tag; rarer tags say more about a product. */
  tagCounts: ReadonlyMap<string, number>;
  /** Products in the catalog. */
  productCount: number;
  trainers: TrainerOptionVM[];
  /** Categories by size, for the empty state's suggestions. */
  topCategories: { code: string; label: string }[];
};

export type SearchResultsVM = {
  cards: ResultCardVM[];
  total: number;
  pageCount: number;
};

export type SearchViewData = {
  state: SearchState;
  facets: FacetGroupVM[];
  /** False when the facet request failed: chips then list every option, without numbers. */
  countsKnown: boolean;
  activeFilters: ActiveFilterVM[];
  /** Null when the search request failed. */
  results: SearchResultsVM | null;
};
