import { queryOptions } from "@tanstack/react-query";

import { apiRequest, type ApiRequestContext, type ApiRequestOptions } from "@/lib/api/client";
import type { PathParams, QueryParams, RequestBody, SuccessResponse } from "@/lib/api/operation-types";

type MeOperation = "me_api_v1_me_get";
type UpdateMeOperation = "update_me_api_v1_me_patch";
type LearningProfileOperation = "learning_profile_api_v1_me_learning_goal_profile_get";
type UpsertLearningProfileOperation = "upsert_learning_profile_api_v1_me_learning_goal_profile_put";
type SkillsOperation = "skills_api_v1_me_skills_get";
type SetTargetSkillsOperation = "set_target_skills_api_v1_me_skills_put";
type OnboardingQuestionsOperation = "onboarding_questions_api_v1_me_onboarding_questions_get";
type CompleteOnboardingOperation = "complete_onboarding_api_v1_me_onboarding_answers_post";
type RecommendationContextOperation = "recommendation_context_api_v1_me_recommendation_context_get";
type WishlistItemsOperation = "wishlist_items_api_v1_me_wishlist_get";
type AddWishlistItemOperation = "add_wishlist_item_api_v1_me_wishlist_post";
type RemoveWishlistItemOperation = "remove_wishlist_item_api_v1_me_wishlist__product_id__delete";

export type CustomerProfileResponse = SuccessResponse<MeOperation>;
export type CustomerProfileUpdateRequest = RequestBody<UpdateMeOperation>;
export type LearningProfileResponse = SuccessResponse<LearningProfileOperation>;
export type LearningProfileUpsertRequest = RequestBody<UpsertLearningProfileOperation>;
export type SkillGraphResponse = SuccessResponse<SkillsOperation>;
export type TargetSkillsUpdateRequest = RequestBody<SetTargetSkillsOperation>;
export type CustomerTargetSkillsResponse = SuccessResponse<SetTargetSkillsOperation>;
export type OnboardingQuestionsResponse = SuccessResponse<OnboardingQuestionsOperation>;
export type OnboardingAnswersRequest = RequestBody<CompleteOnboardingOperation>;
export type OnboardingAnswersResponse = SuccessResponse<CompleteOnboardingOperation>;
export type RecommendationContextResponse = SuccessResponse<RecommendationContextOperation>;
export type WishlistItemsParams = QueryParams<WishlistItemsOperation>;
export type WishlistPageResponse = SuccessResponse<WishlistItemsOperation>;
export type WishlistAddRequest = RequestBody<AddWishlistItemOperation>;
export type WishlistItemResponse = SuccessResponse<AddWishlistItemOperation>;
export type RemoveWishlistItemResponse = SuccessResponse<RemoveWishlistItemOperation>;

type CustomerRequestOptions = Omit<ApiRequestOptions, "context"> & {
  context: ApiRequestContext & { customerId: string };
};

const customerPaths = {
  me: "/api/v1/me",
  learningProfile: "/api/v1/me/learning-goal-profile",
  skills: "/api/v1/me/skills",
  onboardingQuestions: "/api/v1/me/onboarding/questions",
  onboardingAnswers: "/api/v1/me/onboarding/answers",
  recommendationContext: "/api/v1/me/recommendation-context",
  wishlist: "/api/v1/me/wishlist",
  wishlistItem: "/api/v1/me/wishlist/{product_id}",
} as const;

export const customerKeys = {
  all: ["customer"] as const,
  me: (customerId: string) => [...customerKeys.all, customerId, "profile"] as const,
  learningProfile: (customerId: string) => [...customerKeys.all, customerId, "learning-profile"] as const,
  skills: () => [...customerKeys.all, "skills"] as const,
  onboardingQuestions: () => [...customerKeys.all, "onboarding", "questions"] as const,
  recommendationContext: (customerId: string) =>
    [...customerKeys.all, customerId, "recommendation-context"] as const,
  wishlist: (customerId: string, params?: WishlistItemsParams) =>
    [...customerKeys.all, customerId, "wishlist", params ?? {}] as const,
};

export function getMe(options: CustomerRequestOptions): Promise<CustomerProfileResponse> {
  return apiRequest<CustomerProfileResponse>("GET", customerPaths.me, options);
}

export function updateMe(
  body: CustomerProfileUpdateRequest,
  options: CustomerRequestOptions,
): Promise<CustomerProfileResponse> {
  return apiRequest<CustomerProfileResponse>("PATCH", customerPaths.me, {
    ...options,
    body,
  });
}

export function getLearningProfile(options: CustomerRequestOptions): Promise<LearningProfileResponse> {
  return apiRequest<LearningProfileResponse>("GET", customerPaths.learningProfile, options);
}

export function upsertLearningProfile(
  body: LearningProfileUpsertRequest,
  options: CustomerRequestOptions,
): Promise<LearningProfileResponse> {
  return apiRequest<LearningProfileResponse>("PUT", customerPaths.learningProfile, {
    ...options,
    body,
  });
}

export function getSkills(options?: ApiRequestOptions): Promise<SkillGraphResponse> {
  return apiRequest<SkillGraphResponse>("GET", customerPaths.skills, options);
}

export function setTargetSkills(
  body: TargetSkillsUpdateRequest,
  options: CustomerRequestOptions,
): Promise<CustomerTargetSkillsResponse> {
  return apiRequest<CustomerTargetSkillsResponse>("PUT", customerPaths.skills, {
    ...options,
    body,
  });
}

export function getOnboardingQuestions(options?: ApiRequestOptions): Promise<OnboardingQuestionsResponse> {
  return apiRequest<OnboardingQuestionsResponse>("GET", customerPaths.onboardingQuestions, options);
}

export function completeOnboarding(
  body: OnboardingAnswersRequest,
  options: CustomerRequestOptions,
): Promise<OnboardingAnswersResponse> {
  return apiRequest<OnboardingAnswersResponse>("POST", customerPaths.onboardingAnswers, {
    ...options,
    body,
  });
}

export function getRecommendationContext(options: CustomerRequestOptions): Promise<RecommendationContextResponse> {
  return apiRequest<RecommendationContextResponse>("GET", customerPaths.recommendationContext, options);
}

export function getWishlistItems(
  params: WishlistItemsParams | undefined,
  options: CustomerRequestOptions,
): Promise<WishlistPageResponse> {
  return apiRequest<WishlistPageResponse>("GET", customerPaths.wishlist, {
    ...options,
    query: params,
  });
}

export function addWishlistItem(
  body: WishlistAddRequest,
  options: CustomerRequestOptions,
): Promise<WishlistItemResponse> {
  return apiRequest<WishlistItemResponse>("POST", customerPaths.wishlist, {
    ...options,
    body,
  });
}

export function removeWishlistItem(
  productId: PathParams<RemoveWishlistItemOperation>["product_id"],
  options: CustomerRequestOptions,
): Promise<RemoveWishlistItemResponse> {
  return apiRequest<RemoveWishlistItemResponse>("DELETE", customerPaths.wishlistItem, {
    ...options,
    path: { product_id: productId },
  });
}

export const customerQueries = {
  me: (customerId: string, context?: Omit<ApiRequestContext, "customerId">) =>
    queryOptions({
      queryKey: customerKeys.me(customerId),
      queryFn: ({ signal }) => getMe({ signal, context: { ...context, customerId } }),
      staleTime: 60_000,
    }),
  learningProfile: (customerId: string, context?: Omit<ApiRequestContext, "customerId">) =>
    queryOptions({
      queryKey: customerKeys.learningProfile(customerId),
      queryFn: ({ signal }) => getLearningProfile({ signal, context: { ...context, customerId } }),
      staleTime: 60_000,
    }),
  skills: () =>
    queryOptions({
      queryKey: customerKeys.skills(),
      queryFn: ({ signal }) => getSkills({ signal }),
      staleTime: 10 * 60_000,
    }),
  onboardingQuestions: () =>
    queryOptions({
      queryKey: customerKeys.onboardingQuestions(),
      queryFn: ({ signal }) => getOnboardingQuestions({ signal }),
      staleTime: 10 * 60_000,
    }),
  recommendationContext: (customerId: string, context?: Omit<ApiRequestContext, "customerId">) =>
    queryOptions({
      queryKey: customerKeys.recommendationContext(customerId),
      queryFn: ({ signal }) => getRecommendationContext({ signal, context: { ...context, customerId } }),
      staleTime: 60_000,
    }),
  wishlist: (
    customerId: string,
    params?: WishlistItemsParams,
    context?: Omit<ApiRequestContext, "customerId">,
  ) =>
    queryOptions({
      queryKey: customerKeys.wishlist(customerId, params),
      queryFn: ({ signal }) => getWishlistItems(params, { signal, context: { ...context, customerId } }),
      staleTime: 30_000,
    }),
};
