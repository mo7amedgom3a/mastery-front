import type { Route } from "next";

import type { SearchOptionsParams, SearchParams } from "@/lib/api/search";

/**
 * The search page's URL contract: one place turns a URL into filters, filters into a URL, and
 * filters into API parameters. Every link, form, redirect and sitemap entry goes through it, so a
 * given set of filters always has exactly one URL.
 */

export const PRODUCT_TYPES = ["course", "diploma", "package", "consultation"] as const;
export type ProductType = (typeof PRODUCT_TYPES)[number];

/**
 * Off until `migrations/20260930_fix_resource_duration_minutes.sql` is applied in the backend: the
 * index currently stores course durations as seconds × 60, so filtering or sorting by it is wrong.
 */
export const DURATION_FILTER_ENABLED = false;

/**
 * `relevance` is the default: ranked by the query, or newest first when there is none. "Newest"
 * is not offered on its own: the API can't apply it to a ranked (hybrid) result list.
 */
const BASE_SORTS = ["relevance", "price_asc", "price_desc"] as const;
const DURATION_SORTS = ["duration_asc", "duration_desc"] as const;
export type SearchSort = (typeof BASE_SORTS)[number] | (typeof DURATION_SORTS)[number];
export const SORTS: readonly SearchSort[] = DURATION_FILTER_ENABLED ? [...BASE_SORTS, ...DURATION_SORTS] : BASE_SORTS;

/** `hybrid` is the default ("smart search" on); `lexical` is the toggle off; `semantic` is URL-only. */
export const SEARCH_MODES = ["hybrid", "lexical", "semantic"] as const;
export type SearchMode = (typeof SEARCH_MODES)[number];

export const PAGE_SIZE = 24;
const MAX_PAGE = 500;
const MAX_QUERY_LENGTH = 200;
const MAX_VALUES_PER_FACET = 12;
const MAX_AMOUNT = 1_000_000;
/** Category, skill and tag codes: `legacy-category-27`, `marketing/digital-marketing`, `data-analysis`. */
const SLUG = /^[a-z0-9][a-z0-9/_.-]{0,79}$/;

export type SearchState = {
  q: string;
  types: ProductType[];
  categories: string[];
  skills: string[];
  tags: string[];
  /** Legacy trainer ids. */
  trainers: number[];
  /** Only products taught by an expert trainer. */
  expert: boolean;
  priceMin: number | null;
  priceMax: number | null;
  hoursMin: number | null;
  hoursMax: number | null;
  sort: SearchSort;
  mode: SearchMode;
  /** 1-based. */
  page: number;
};

export const emptySearchState: SearchState = {
  q: "",
  types: [],
  categories: [],
  skills: [],
  tags: [],
  trainers: [],
  expert: false,
  priceMin: null,
  priceMax: null,
  hoursMin: null,
  hoursMax: null,
  sort: "relevance",
  mode: "hybrid",
  page: 1,
};

export type RawSearchParams = Record<string, string | string[] | undefined>;

function values(raw: RawSearchParams, key: string): string[] {
  const value = raw[key];
  const list = value === undefined ? [] : Array.isArray(value) ? value : [value];
  // `a,b` is accepted next to repeated params, so hand-written links are forgiving.
  return list.flatMap((item) => item.split(",")).map((item) => item.trim()).filter(Boolean);
}

function first(raw: RawSearchParams, key: string): string {
  const value = raw[key];
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)].slice(0, MAX_VALUES_PER_FACET);
}

function slugs(raw: RawSearchParams, key: string): string[] {
  return unique(values(raw, key).map((value) => value.toLowerCase()).filter((value) => SLUG.test(value)));
}

function amount(raw: RawSearchParams, key: string): number | null {
  const text = first(raw, key);
  if (!/^\d+(\.\d+)?$/.test(text)) return null;
  const value = Number(text);
  return Number.isFinite(value) && value >= 0 && value <= MAX_AMOUNT ? value : null;
}

/** Low/high pair in order, whichever way round it was typed. */
function range(min: number | null, max: number | null): [number | null, number | null] {
  return min !== null && max !== null && min > max ? [max, min] : [min, max];
}

function isOneOf<T extends string>(list: readonly T[], value: string): value is T {
  return (list as readonly string[]).includes(value);
}

/** Reads a URL's query into filters. Anything malformed is dropped rather than rejected. */
export function parseSearchParams(raw: RawSearchParams): SearchState {
  const q = first(raw, "q").replace(/\s+/g, " ").slice(0, MAX_QUERY_LENGTH);
  const types = unique(values(raw, "type").map((value) => value.toLowerCase())).filter((value) =>
    isOneOf(PRODUCT_TYPES, value),
  );
  // Links from the old site and the landing page name a category by its legacy id.
  const categories = slugs(
    { category: values(raw, "category").map((value) => (/^\d+$/.test(value) ? `legacy-category-${value}` : value)) },
    "category",
  );
  const trainers = unique(
    values(raw, "trainer")
      .filter((value) => /^[1-9]\d{0,8}$/.test(value))
      .map(Number),
  );
  const [priceMin, priceMax] = range(amount(raw, "price_min"), amount(raw, "price_max"));
  const [hoursMin, hoursMax] = DURATION_FILTER_ENABLED
    ? range(amount(raw, "hours_min"), amount(raw, "hours_max"))
    : [null, null];
  const sort = first(raw, "sort");
  const mode = first(raw, "mode");
  const page = /^\d{1,4}$/.test(first(raw, "page")) ? Number(first(raw, "page")) : 1;

  return {
    q,
    types,
    categories,
    skills: slugs(raw, "skill"),
    tags: slugs(raw, "tag"),
    trainers,
    expert: first(raw, "expert") === "1",
    priceMin,
    priceMax,
    hoursMin,
    hoursMax,
    sort: isOneOf(SORTS, sort) ? sort : "relevance",
    mode: isOneOf(SEARCH_MODES, mode) ? mode : "hybrid",
    page: Math.min(Math.max(page, 1), MAX_PAGE),
  };
}

export type KnownFacets = {
  categories: ReadonlySet<string>;
  skills: ReadonlySet<string>;
  tags: ReadonlySet<string>;
  trainers: ReadonlySet<number>;
};

/** Drops facet values the catalog doesn't have (typos, removed categories, made-up values). */
export function keepKnownFacets(state: SearchState, known: KnownFacets): SearchState {
  return {
    ...state,
    categories: state.categories.filter((value) => known.categories.has(value)),
    skills: state.skills.filter((value) => known.skills.has(value)),
    tags: state.tags.filter((value) => known.tags.has(value)),
    trainers: state.trainers.filter((value) => known.trainers.has(value)),
  };
}

/** Query-string pairs for a state, in canonical order, defaults left out. */
export function searchEntries(state: SearchState): [string, string][] {
  const entries: [string, string][] = [];
  if (state.q) entries.push(["q", state.q]);
  for (const type of state.types) entries.push(["type", type]);
  for (const category of state.categories) entries.push(["category", category]);
  for (const skill of state.skills) entries.push(["skill", skill]);
  for (const tag of state.tags) entries.push(["tag", tag]);
  for (const trainer of state.trainers) entries.push(["trainer", String(trainer)]);
  if (state.expert) entries.push(["expert", "1"]);
  if (state.priceMin !== null) entries.push(["price_min", String(state.priceMin)]);
  if (state.priceMax !== null) entries.push(["price_max", String(state.priceMax)]);
  if (state.hoursMin !== null) entries.push(["hours_min", String(state.hoursMin)]);
  if (state.hoursMax !== null) entries.push(["hours_max", String(state.hoursMax)]);
  if (state.sort !== "relevance") entries.push(["sort", state.sort]);
  if (state.mode !== "hybrid") entries.push(["mode", state.mode]);
  if (state.page > 1) entries.push(["page", String(state.page)]);
  return entries;
}

export const SEARCH_PATH = "/search";

/** The one URL for a state. Slashes in skill codes stay readable (`skill=marketing/sales`). */
export function searchHref(state: SearchState): Route {
  const query = new URLSearchParams(searchEntries(state)).toString().replaceAll("%2F", "/");
  return (query ? `${SEARCH_PATH}?${query}` : SEARCH_PATH) as Route;
}

/** A changed filter always starts again from the first page. */
export function withFilters(state: SearchState, patch: Partial<Omit<SearchState, "page">>): SearchState {
  return { ...state, ...patch, page: 1 };
}

export function toggled<T>(list: readonly T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

/** Everything but the query text, sort and mode: what "clear filters" removes. */
export function hasFilters(state: SearchState): boolean {
  return (
    state.types.length > 0 ||
    state.categories.length > 0 ||
    state.skills.length > 0 ||
    state.tags.length > 0 ||
    state.trainers.length > 0 ||
    state.expert ||
    state.priceMin !== null ||
    state.priceMax !== null ||
    state.hoursMin !== null ||
    state.hoursMax !== null
  );
}

export function clearFilters(state: SearchState): SearchState {
  return { ...emptySearchState, q: state.q, sort: state.sort, mode: state.mode };
}

/**
 * Listings worth a place in search engines: the whole catalog, one product type, one category, or
 * both. Keyword searches and every finer combination are thin or duplicate, so they stay out.
 */
export function isIndexableState(state: SearchState): boolean {
  return (
    !state.q &&
    state.types.length <= 1 &&
    state.categories.length <= 1 &&
    state.skills.length === 0 &&
    state.tags.length === 0 &&
    state.trainers.length === 0 &&
    !state.expert &&
    state.priceMin === null &&
    state.priceMax === null &&
    state.hoursMin === null &&
    state.hoursMax === null &&
    state.sort === "relevance" &&
    state.mode === "hybrid"
  );
}

/**
 * Whether the API responses for this state may be kept in the shared server cache. Free-form
 * input (query text, numeric ranges) has an unbounded key space and is never cached; facet-only
 * states are bounded by the catalog once `keepKnownFacets` has run.
 */
export function isCacheableState(state: SearchState): boolean {
  return (
    !state.q &&
    state.priceMin === null &&
    state.priceMax === null &&
    state.hoursMin === null &&
    state.hoursMax === null
  );
}

/** The structured filters, shared by the result and the facet requests. */
function filterParams(state: SearchState) {
  return {
    product_type: state.types,
    category: state.categories,
    skill: state.skills,
    tag: state.tags,
    trainer_id: state.trainers,
    expert_instructor_only: state.expert || undefined,
    min_price: state.priceMin ?? undefined,
    max_price: state.priceMax ?? undefined,
    min_duration_minutes: state.hoursMin === null ? undefined : Math.round(state.hoursMin * 60),
    max_duration_minutes: state.hoursMax === null ? undefined : Math.round(state.hoursMax * 60),
  } satisfies SearchOptionsParams;
}

export function toSearchApiParams(state: SearchState): SearchParams {
  return {
    ...filterParams(state),
    q: state.q || undefined,
    sort: state.sort,
    search_mode: state.mode,
    // The page is rendered on the server for every visitor: the server's own request history
    // must not re-rank their results, and pages must keep one order.
    personalize: false,
    limit: PAGE_SIZE,
    offset: (state.page - 1) * PAGE_SIZE,
  };
}

/** API maximum for facet lists. */
const OPTIONS_LIMIT = 500;

export function toOptionsApiParams(state: SearchState): SearchOptionsParams {
  return { ...filterParams(state), limit: OPTIONS_LIMIT };
}

export const baseOptionsApiParams: SearchOptionsParams = { limit: OPTIONS_LIMIT };
