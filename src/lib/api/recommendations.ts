import { queryOptions } from "@tanstack/react-query";

import { apiRequest, type ApiRequestContext, type ApiRequestOptions } from "@/lib/api/client";
import type { PathParams, QueryParams, SuccessResponse } from "@/lib/api/operation-types";

type ProductRecommendationsOperation = "product_recommendations_api_v1_recommendations_products__slug__get";
type MyRecommendationsOperation = "my_recommendations_api_v1_recommendations_me_get";
type LandingRecommendationsOperation = "landing_recommendations_api_v1_recommendations_landing_get";
type RebuildRecommendationsOperation = "rebuild_recommendations_api_v1_recommendations_rebuild_post";
type GetRecommendationRebuildOperation = "get_recommendation_rebuild_api_v1_recommendations_rebuild__job_id__get";

export type ProductRecommendationsParams = QueryParams<ProductRecommendationsOperation>;
export type ProductRecommendationsResponse = SuccessResponse<ProductRecommendationsOperation>;
export type MyRecommendationsParams = QueryParams<MyRecommendationsOperation>;
export type MyRecommendationsResponse = SuccessResponse<MyRecommendationsOperation>;
export type LandingRecommendationsParams = QueryParams<LandingRecommendationsOperation>;
export type LandingRecommendationsResponse = SuccessResponse<LandingRecommendationsOperation>;
export type RecommendationJobResponse = SuccessResponse<RebuildRecommendationsOperation>;

type AuthenticatedRequestOptions = Omit<ApiRequestOptions, "credentials">;
type RebuildOptions = Omit<ApiRequestOptions, "context"> & {
  context: ApiRequestContext & { rebuildToken: string };
};

const recommendationPaths = {
  product: "/api/v1/recommendations/products/{slug}",
  me: "/api/v1/recommendations/me",
  landing: "/api/v1/recommendations/landing",
  rebuild: "/api/v1/recommendations/rebuild",
  rebuildJob: "/api/v1/recommendations/rebuild/{job_id}",
} as const;

export const recommendationKeys = {
  all: ["recommendations"] as const,
  product: (slug: string, params?: ProductRecommendationsParams) =>
    [...recommendationKeys.all, "products", slug, params ?? {}] as const,
  me: (params?: MyRecommendationsParams) => [...recommendationKeys.all, "me", params ?? {}] as const,
  landing: (params?: LandingRecommendationsParams) => [...recommendationKeys.all, "landing", params ?? {}] as const,
  rebuildJob: (jobId: string) => [...recommendationKeys.all, "rebuild", jobId] as const,
};

export function getProductRecommendations(
  slug: string,
  params?: ProductRecommendationsParams,
  options?: ApiRequestOptions,
): Promise<ProductRecommendationsResponse> {
  return apiRequest<ProductRecommendationsResponse>("GET", recommendationPaths.product, {
    ...options,
    path: { slug },
    query: params,
  });
}

export function getMyRecommendations(
  params: MyRecommendationsParams | undefined,
  options?: AuthenticatedRequestOptions,
): Promise<MyRecommendationsResponse> {
  return apiRequest<MyRecommendationsResponse>("GET", recommendationPaths.me, {
    ...options,
    credentials: "include",
    query: params,
  });
}

export function getLandingRecommendations(
  params?: LandingRecommendationsParams,
  options?: ApiRequestOptions,
): Promise<LandingRecommendationsResponse> {
  return apiRequest<LandingRecommendationsResponse>("GET", recommendationPaths.landing, {
    ...options,
    query: params,
  });
}

export function rebuildRecommendations(options: RebuildOptions): Promise<RecommendationJobResponse> {
  return apiRequest<RecommendationJobResponse>("POST", recommendationPaths.rebuild, options);
}

export function getRecommendationRebuildJob(
  jobId: PathParams<GetRecommendationRebuildOperation>["job_id"],
  options: RebuildOptions,
): Promise<RecommendationJobResponse> {
  return apiRequest<RecommendationJobResponse>("GET", recommendationPaths.rebuildJob, {
    ...options,
    path: { job_id: jobId },
  });
}

export const recommendationQueries = {
  product: (slug: string, params?: ProductRecommendationsParams) =>
    queryOptions({
      queryKey: recommendationKeys.product(slug, params),
      queryFn: ({ signal }) => getProductRecommendations(slug, params, { signal }),
      staleTime: 5 * 60_000,
    }),
  me: (params?: MyRecommendationsParams, context?: ApiRequestContext) =>
    queryOptions({
      queryKey: recommendationKeys.me(params),
      queryFn: ({ signal }) => getMyRecommendations(params, { signal, context }),
      staleTime: 60_000,
    }),
  landing: (params?: LandingRecommendationsParams) =>
    queryOptions({
      queryKey: recommendationKeys.landing(params),
      queryFn: ({ signal }) => getLandingRecommendations(params, { signal }),
      staleTime: 5 * 60_000,
    }),
  rebuildJob: (jobId: string, rebuildToken: string, context?: Omit<ApiRequestContext, "rebuildToken">) =>
    queryOptions({
      queryKey: recommendationKeys.rebuildJob(jobId),
      queryFn: ({ signal }) =>
        getRecommendationRebuildJob(jobId, { signal, context: { ...context, rebuildToken } }),
      staleTime: 15_000,
    }),
};
