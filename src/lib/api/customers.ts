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

type AuthenticatedRequestOptions = Omit<ApiRequestOptions, "credentials">;

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
  me: () => [...customerKeys.all, "me"] as const,
  learningProfile: () => [...customerKeys.all, "learning-profile"] as const,
  skills: () => [...customerKeys.all, "skills"] as const,
  onboardingQuestions: () => [...customerKeys.all, "onboarding", "questions"] as const,
  recommendationContext: () => [...customerKeys.all, "recommendation-context"] as const,
  wishlist: (params?: WishlistItemsParams) => [...customerKeys.all, "wishlist", params ?? {}] as const,
};

function withAuthCookies(options?: AuthenticatedRequestOptions): AuthenticatedRequestOptions & { credentials: "include" } {
  return {
    ...options,
    credentials: "include",
  };
}

export function getMe(options?: AuthenticatedRequestOptions): Promise<CustomerProfileResponse> {
  return apiRequest<CustomerProfileResponse>("GET", customerPaths.me, withAuthCookies(options));
}

export function updateMe(
  body: CustomerProfileUpdateRequest,
  options?: AuthenticatedRequestOptions,
): Promise<CustomerProfileResponse> {
  return apiRequest<CustomerProfileResponse>("PATCH", customerPaths.me, {
    ...withAuthCookies(options),
    body,
  });
}

export function getLearningProfile(options?: AuthenticatedRequestOptions): Promise<LearningProfileResponse> {
  return apiRequest<LearningProfileResponse>("GET", customerPaths.learningProfile, withAuthCookies(options));
}

export function upsertLearningProfile(
  body: LearningProfileUpsertRequest,
  options?: AuthenticatedRequestOptions,
): Promise<LearningProfileResponse> {
  return apiRequest<LearningProfileResponse>("PUT", customerPaths.learningProfile, {
    ...withAuthCookies(options),
    body,
  });
}

export function getSkills(options?: AuthenticatedRequestOptions): Promise<SkillGraphResponse> {
  return apiRequest<SkillGraphResponse>("GET", customerPaths.skills, withAuthCookies(options));
}

export function setTargetSkills(
  body: TargetSkillsUpdateRequest,
  options?: AuthenticatedRequestOptions,
): Promise<CustomerTargetSkillsResponse> {
  return apiRequest<CustomerTargetSkillsResponse>("PUT", customerPaths.skills, {
    ...withAuthCookies(options),
    body,
  });
}

export function getOnboardingQuestions(options?: AuthenticatedRequestOptions): Promise<OnboardingQuestionsResponse> {
  return apiRequest<OnboardingQuestionsResponse>("GET", customerPaths.onboardingQuestions, withAuthCookies(options));
}

export function completeOnboarding(
  body: OnboardingAnswersRequest,
  options?: AuthenticatedRequestOptions,
): Promise<OnboardingAnswersResponse> {
  return apiRequest<OnboardingAnswersResponse>("POST", customerPaths.onboardingAnswers, {
    ...withAuthCookies(options),
    body,
  });
}

export function getRecommendationContext(options?: AuthenticatedRequestOptions): Promise<RecommendationContextResponse> {
  return apiRequest<RecommendationContextResponse>("GET", customerPaths.recommendationContext, withAuthCookies(options));
}

export function getWishlistItems(
  params: WishlistItemsParams | undefined,
  options?: AuthenticatedRequestOptions,
): Promise<WishlistPageResponse> {
  return apiRequest<WishlistPageResponse>("GET", customerPaths.wishlist, {
    ...withAuthCookies(options),
    query: params,
  });
}

export function addWishlistItem(
  body: WishlistAddRequest,
  options?: AuthenticatedRequestOptions,
): Promise<WishlistItemResponse> {
  return apiRequest<WishlistItemResponse>("POST", customerPaths.wishlist, {
    ...withAuthCookies(options),
    body,
  });
}

export function removeWishlistItem(
  productId: PathParams<RemoveWishlistItemOperation>["product_id"],
  options?: AuthenticatedRequestOptions,
): Promise<RemoveWishlistItemResponse> {
  return apiRequest<RemoveWishlistItemResponse>("DELETE", customerPaths.wishlistItem, {
    ...withAuthCookies(options),
    path: { product_id: productId },
  });
}

export const customerQueries = {
  me: (context?: ApiRequestContext) =>
    queryOptions({
      queryKey: customerKeys.me(),
      queryFn: ({ signal }) => getMe({ signal, context }),
      staleTime: 60_000,
    }),
  learningProfile: (context?: ApiRequestContext) =>
    queryOptions({
      queryKey: customerKeys.learningProfile(),
      queryFn: ({ signal }) => getLearningProfile({ signal, context }),
      staleTime: 60_000,
    }),
  skills: (context?: ApiRequestContext) =>
    queryOptions({
      queryKey: customerKeys.skills(),
      queryFn: ({ signal }) => getSkills({ signal, context }),
      staleTime: 10 * 60_000,
    }),
  onboardingQuestions: (context?: ApiRequestContext) =>
    queryOptions({
      queryKey: customerKeys.onboardingQuestions(),
      queryFn: ({ signal }) => getOnboardingQuestions({ signal, context }),
      staleTime: 10 * 60_000,
    }),
  recommendationContext: (context?: ApiRequestContext) =>
    queryOptions({
      queryKey: customerKeys.recommendationContext(),
      queryFn: ({ signal }) => getRecommendationContext({ signal, context }),
      staleTime: 60_000,
    }),
  wishlist: (params?: WishlistItemsParams, context?: ApiRequestContext) =>
    queryOptions({
      queryKey: customerKeys.wishlist(params),
      queryFn: ({ signal }) => getWishlistItems(params, { signal, context }),
      staleTime: 30_000,
    }),
};
