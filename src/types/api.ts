import type { components, operations, paths } from "@/types/openapi";

export type { components, operations, paths } from "@/types/openapi";

export type ApiSchemas = components["schemas"];
export type ApiSchema<Name extends keyof ApiSchemas> = ApiSchemas[Name];

export type HealthResponse = ApiSchema<"HealthResponse">;
export type DatabaseHealthResponse = ApiSchema<"DatabaseHealthResponse">;
export type ProductTypeResponse = ApiSchema<"ProductTypeResponse">;
export type CatalogCategoryResponse =
  ApiSchema<"app__modules__catalog__presentation__schemas__CategoryResponse">;
export type ProductPageResponse = ApiSchema<"ProductPageResponse">;
export type ProductResponse = ApiSchema<"ProductResponse">;
export type ProductDetailResponse = ApiSchema<"ProductDetailResponse">;
export type ResourceResponse = ApiSchema<"ResourceResponse">;
export type RecommendationPageResponse = ApiSchema<"RecommendationPageResponse">;
export type CustomerProfileResponse = ApiSchema<"CustomerProfileResponse">;
export type CustomerProfileUpdateRequest = ApiSchema<"CustomerProfileUpdateRequest">;
export type LearningProfileResponse = ApiSchema<"LearningProfileResponse">;
export type LearningProfileUpsertRequest = ApiSchema<"LearningProfileUpsertRequest">;
export type SkillResponse = ApiSchema<"SkillResponse">;
export type CustomerTargetSkillResponse = ApiSchema<"CustomerTargetSkillResponse">;
export type TargetSkillsUpdateRequest = ApiSchema<"TargetSkillsUpdateRequest">;
export type OnboardingQuestionResponse = ApiSchema<"OnboardingQuestionResponse">;
export type OnboardingAnswersRequest = ApiSchema<"OnboardingAnswersRequest">;
export type OnboardingAnswerResponse = ApiSchema<"OnboardingAnswerResponse">;
export type RecommendationContextResponse = ApiSchema<"RecommendationContextResponse">;
export type WishlistPageResponse = ApiSchema<"WishlistPageResponse">;
export type WishlistAddRequest = ApiSchema<"WishlistAddRequest">;
export type WishlistItemResponse = ApiSchema<"WishlistItemResponse">;
export type LegacyCategoryResponse =
  ApiSchema<"app__modules__legacy__presentation__schemas__CategoryResponse">;
export type LegacyInstructorResponse =
  ApiSchema<"app__modules__legacy__presentation__schemas__InstructorResponse">;
export type CourseResponse = ApiSchema<"CourseResponse">;
export type CourseDetailResponse = ApiSchema<"CourseDetailResponse">;
export type CollectionResponse = ApiSchema<"CollectionResponse">;
export type CollectionDetailResponse = ApiSchema<"CollectionDetailResponse">;
export type ConsultationResponse = ApiSchema<"ConsultationResponse">;
export type ConsultationDetailResponse = ApiSchema<"ConsultationDetailResponse">;
export type LandingPageResponse = ApiSchema<"LandingPageResponse">;
export type LandingInsightsResponse = ApiSchema<"LandingInsightsResponse">;
export type SearchRequest = ApiSchema<"SearchRequest">;
export type SearchPageResponse = ApiSchema<"SearchPageResponse">;
export type SearchOptionsResponse = ApiSchema<"SearchOptionsResponse">;
export type SearchInstructorResponse = ApiSchema<"SearchInstructorResponse">;
export type SearchProductDetailResponse = ApiSchema<"SearchProductDetailResponse">;
export type RecommendationJobResponse = ApiSchema<"RecommendationJobResponse">;
