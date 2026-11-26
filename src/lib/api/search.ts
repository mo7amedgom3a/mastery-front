import { queryOptions } from "@tanstack/react-query";

import { apiRequest, type ApiRequestOptions } from "@/lib/api/client";
import type { PathParams, QueryParams, RequestBody, SuccessResponse } from "@/lib/api/operation-types";
import { getClientFingerprint } from "@/lib/customer-tracking";

type SearchOperation = "search_api_v1_search_get";
type AdvancedSearchOperation = "advanced_search_api_v1_search_post";
type SearchOptionsOperation = "search_options_api_v1_search_options_get";
type SearchInstructorsOperation = "search_instructors_api_v1_search_instructors_get";
type SearchProductDetailsOperation = "search_product_details_api_v1_search_products__slug__details_get";
type SearchInstructorDetailsOperation = "search_instructor_details_api_v1_search_instructors__trainer_id__details_get";

export type SearchParams = QueryParams<SearchOperation>;
export type SearchResponse = SuccessResponse<SearchOperation>;
export type AdvancedSearchRequest = RequestBody<AdvancedSearchOperation>;
export type SearchOptionsParams = QueryParams<SearchOptionsOperation>;
export type SearchOptionsResponse = SuccessResponse<SearchOptionsOperation>;
export type SearchInstructorsParams = QueryParams<SearchInstructorsOperation>;
export type SearchInstructorsResponse = SuccessResponse<SearchInstructorsOperation>;
export type SearchProductDetailsResponse = SuccessResponse<SearchProductDetailsOperation>;
export type SearchInstructorDetailsResponse = SuccessResponse<SearchInstructorDetailsOperation>;

/**
 * The typeahead contract. Hand-written because `src/types/openapi.ts` predates this endpoint
 * (it also misses newer modules); regenerate both together in a separate change.
 */
export type AutocompleteSuggestionType = "keyword" | "popular_search" | "spelling";

export type AutocompleteSuggestion = {
  text: string;
  type: AutocompleteSuggestionType;
};

export type AutocompleteResult = {
  id: string;
  slug: string | null;
  title: string;
  /** Catalog product type (`course`, `diploma`, `package`, `consultation`, `bundle`, `live_diploma`). */
  type: string;
  /** Storefront path; null when the slug is not addressable (the caller can fall back). */
  url: string | null;
  description: string | null;
  image: string | null;
  rating: number | null;
};

export type AutocompleteResponse = {
  query: string;
  suggestions: AutocompleteSuggestion[];
  results: AutocompleteResult[];
};

export type AutocompleteParams = { q: string; limit?: number };

export const AUTOCOMPLETE_LIMIT = 8;
const AUTOCOMPLETE_TIMEOUT_MS = 4_000;

const searchPaths = {
  search: "/api/v1/search",
  autocomplete: "/api/v1/search/autocomplete",
  options: "/api/v1/search/options",
  instructors: "/api/v1/search/instructors",
  productDetails: "/api/v1/search/products/{slug}/details",
  instructorDetails: "/api/v1/search/instructors/{trainer_id}/details",
} as const;

export const searchKeys = {
  all: ["search"] as const,
  results: (params?: SearchParams) => [...searchKeys.all, "results", params ?? {}] as const,
  advanced: (body: AdvancedSearchRequest) => [...searchKeys.all, "advanced", body] as const,
  autocomplete: (params: AutocompleteParams) =>
    [...searchKeys.all, "autocomplete", params] as const,
  options: (params?: SearchOptionsParams) => [...searchKeys.all, "options", params ?? {}] as const,
  instructors: (params?: SearchInstructorsParams) => [...searchKeys.all, "instructors", params ?? {}] as const,
  productDetails: (slug: string) => [...searchKeys.all, "products", slug] as const,
  instructorDetails: (trainerId: number) => [...searchKeys.all, "instructors", trainerId, "details"] as const,
};

export function searchProducts(
  params?: SearchParams,
  options?: ApiRequestOptions,
): Promise<SearchResponse> {
  return apiRequest<SearchResponse>("GET", searchPaths.search, {
    ...options,
    credentials: "include",
    query: params,
  });
}

export function advancedSearch(
  body: AdvancedSearchRequest,
  options?: ApiRequestOptions,
): Promise<SearchResponse> {
  return apiRequest<SearchResponse>("POST", searchPaths.search, {
    ...options,
    credentials: "include",
    body,
  });
}

/**
 * Typeahead suggestions and matching programs. Browser-only in practice: the request goes
 * through this app's same-origin `/api/b2c` door (cookies are not sent to the backend origin)
 * and carries the visitor fingerprint so the endpoint's rate limit counts the visitor, not
 * the server. A 4-second timeout keeps a stalled backend from leaving the dropdown loading.
 */
export function getSearchAutocomplete(
  params: AutocompleteParams,
  options?: ApiRequestOptions,
): Promise<AutocompleteResponse> {
  const browser = typeof window !== "undefined";
  const timeout = AbortSignal.timeout(AUTOCOMPLETE_TIMEOUT_MS);
  const signal =
    options?.signal && typeof AbortSignal.any === "function"
      ? AbortSignal.any([options.signal, timeout])
      : (options?.signal ?? timeout);

  return apiRequest<AutocompleteResponse>("GET", searchPaths.autocomplete, {
    ...options,
    signal,
    query: params,
    sameOrigin: browser,
    context: browser ? { clientFingerprint: getClientFingerprint() } : undefined,
  });
}

export function getSearchOptions(
  params?: SearchOptionsParams,
  options?: ApiRequestOptions,
): Promise<SearchOptionsResponse> {
  return apiRequest<SearchOptionsResponse>("GET", searchPaths.options, { ...options, query: params });
}

export function getSearchInstructors(
  params?: SearchInstructorsParams,
  options?: ApiRequestOptions,
): Promise<SearchInstructorsResponse> {
  return apiRequest<SearchInstructorsResponse>("GET", searchPaths.instructors, { ...options, query: params });
}

export function getSearchProductDetails(
  slug: string,
  options?: ApiRequestOptions,
): Promise<SearchProductDetailsResponse> {
  return apiRequest<SearchProductDetailsResponse>("GET", searchPaths.productDetails, {
    ...options,
    credentials: "include",
    path: { slug },
  });
}

export function getSearchInstructorDetails(
  trainerId: PathParams<SearchInstructorDetailsOperation>["trainer_id"],
  options?: ApiRequestOptions,
): Promise<SearchInstructorDetailsResponse> {
  return apiRequest<SearchInstructorDetailsResponse>("GET", searchPaths.instructorDetails, {
    ...options,
    path: { trainer_id: trainerId },
  });
}

export const searchQueries = {
  results: (params?: SearchParams) =>
    queryOptions({
      queryKey: searchKeys.results(params),
      queryFn: ({ signal }) => searchProducts(params, { signal }),
      staleTime: 60_000,
    }),
  advanced: (body: AdvancedSearchRequest) =>
    queryOptions({
      queryKey: searchKeys.advanced(body),
      queryFn: ({ signal }) => advancedSearch(body, { signal }),
      staleTime: 60_000,
    }),
  autocomplete: (params: AutocompleteParams) =>
    queryOptions({
      queryKey: searchKeys.autocomplete(params),
      queryFn: ({ signal }) => getSearchAutocomplete(params, { signal }),
      // Recent queries are reused while the visitor retypes; typeahead failures are silent
      // (Enter still searches), so never retry them.
      staleTime: 60_000,
      retry: false,
      refetchOnWindowFocus: false,
    }),
  options: (params?: SearchOptionsParams) =>
    queryOptions({
      queryKey: searchKeys.options(params),
      queryFn: ({ signal }) => getSearchOptions(params, { signal }),
      staleTime: 10 * 60_000,
    }),
  instructors: (params?: SearchInstructorsParams) =>
    queryOptions({
      queryKey: searchKeys.instructors(params),
      queryFn: ({ signal }) => getSearchInstructors(params, { signal }),
      staleTime: 5 * 60_000,
    }),
  productDetails: (slug: string) =>
    queryOptions({
      queryKey: searchKeys.productDetails(slug),
      queryFn: ({ signal }) => getSearchProductDetails(slug, { signal }),
      staleTime: 5 * 60_000,
    }),
  instructorDetails: (trainerId: number) =>
    queryOptions({
      queryKey: searchKeys.instructorDetails(trainerId),
      queryFn: ({ signal }) => getSearchInstructorDetails(trainerId, { signal }),
      staleTime: 5 * 60_000,
    }),
};
