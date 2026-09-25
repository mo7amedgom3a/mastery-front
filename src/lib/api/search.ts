import { queryOptions } from "@tanstack/react-query";

import { apiRequest, type ApiRequestContext, type ApiRequestOptions } from "@/lib/api/client";
import type { PathParams, QueryParams, RequestBody, SuccessResponse } from "@/lib/api/operation-types";

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

const searchPaths = {
  search: "/api/v1/search",
  options: "/api/v1/search/options",
  instructors: "/api/v1/search/instructors",
  productDetails: "/api/v1/search/products/{slug}/details",
  instructorDetails: "/api/v1/search/instructors/{trainer_id}/details",
} as const;

export const searchKeys = {
  all: ["search"] as const,
  results: (params?: SearchParams, customerId?: string) =>
    [...searchKeys.all, "results", customerId ?? "anonymous", params ?? {}] as const,
  advanced: (body: AdvancedSearchRequest, customerId?: string) =>
    [...searchKeys.all, "advanced", customerId ?? "anonymous", body] as const,
  options: (params?: SearchOptionsParams) => [...searchKeys.all, "options", params ?? {}] as const,
  instructors: (params?: SearchInstructorsParams) => [...searchKeys.all, "instructors", params ?? {}] as const,
  productDetails: (slug: string, customerId?: string) =>
    [...searchKeys.all, "products", slug, customerId ?? "anonymous"] as const,
  instructorDetails: (trainerId: number) => [...searchKeys.all, "instructors", trainerId, "details"] as const,
};

export function searchProducts(
  params?: SearchParams,
  options?: ApiRequestOptions,
): Promise<SearchResponse> {
  return apiRequest<SearchResponse>("GET", searchPaths.search, { ...options, query: params });
}

export function advancedSearch(
  body: AdvancedSearchRequest,
  options?: ApiRequestOptions,
): Promise<SearchResponse> {
  return apiRequest<SearchResponse>("POST", searchPaths.search, { ...options, body });
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
  results: (params?: SearchParams, context?: ApiRequestContext) =>
    queryOptions({
      queryKey: searchKeys.results(params, context?.customerId),
      queryFn: ({ signal }) => searchProducts(params, { signal, context }),
      staleTime: 60_000,
    }),
  advanced: (body: AdvancedSearchRequest, context?: ApiRequestContext) =>
    queryOptions({
      queryKey: searchKeys.advanced(body, context?.customerId),
      queryFn: ({ signal }) => advancedSearch(body, { signal, context }),
      staleTime: 60_000,
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
  productDetails: (slug: string, context?: ApiRequestContext) =>
    queryOptions({
      queryKey: searchKeys.productDetails(slug, context?.customerId),
      queryFn: ({ signal }) => getSearchProductDetails(slug, { signal, context }),
      staleTime: 5 * 60_000,
    }),
  instructorDetails: (trainerId: number) =>
    queryOptions({
      queryKey: searchKeys.instructorDetails(trainerId),
      queryFn: ({ signal }) => getSearchInstructorDetails(trainerId, { signal }),
      staleTime: 5 * 60_000,
    }),
};
