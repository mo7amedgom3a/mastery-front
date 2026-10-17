/*
 * Types of the legacy-platform DTOs (generated from the OpenAPI spec). The storefront no longer calls any
 * `/api/v1/legacy/*` endpoint: product data is read from B2C (`browse.ts`, `catalog.ts`), and the card
 * adapters in `browse.ts` build these shapes so the existing mappers keep working. Delete the types as the
 * mappers move to the B2C DTOs.
 */
import type { QueryParams, SuccessResponse } from "@/lib/api/operation-types";

type LegacyRelatedOperation = "related_resources_api_v1_legacy_resources__resource_type___legacy_id__related_get";
type LegacyRecommendationsOperation =
  "resource_recommendations_api_v1_legacy_resources__resource_type___legacy_id__recommendations_get";
type LandingPageOperation = "landing_page_api_v1_legacy_landing_page_get";
type LandingInsightsOperation = "landing_insights_api_v1_legacy_insights_get";
type LegacyCategoriesOperation = "categories_api_v1_legacy_categories_get";
type LegacyCategoryOperation = "category_api_v1_legacy_categories__category_id__get";
type LegacyCategoryCoursesOperation = "category_courses_api_v1_legacy_categories__category_id__courses_get";
type LegacyCategoryInstructorsOperation =
  "category_instructors_api_v1_legacy_categories__category_id__instructors_get";
type LegacyInstructorsOperation = "instructors_api_v1_legacy_instructors_get";
type LegacyInstructorOperation = "instructor_api_v1_legacy_instructors__instructor_id__get";
type LegacyInstructorCoursesOperation = "instructor_courses_api_v1_legacy_instructors__instructor_id__courses_get";
type LegacyInstructorDiplomasOperation =
  "instructor_diplomas_api_v1_legacy_instructors__instructor_id__diplomas_get";
type LegacyInstructorPackagesOperation =
  "instructor_packages_api_v1_legacy_instructors__instructor_id__packages_get";
type LegacyInstructorCategoriesOperation =
  "instructor_categories_api_v1_legacy_instructors__instructor_id__categories_get";
type LegacyCoursesOperation = "courses_api_v1_legacy_courses_get";
type LegacyCourseOperation = "course_api_v1_legacy_courses__course_id__get";
type LegacyCoursePricesOperation = "course_prices_api_v1_legacy_courses__course_id__prices_get";
type LegacyDiplomasOperation = "diplomas_api_v1_legacy_diplomas_get";
type LegacyDiplomaOperation = "diploma_api_v1_legacy_diplomas__diploma_id__get";
type LegacyPackagesOperation = "packages_api_v1_legacy_packages_get";
type LegacyPackageOperation = "package_api_v1_legacy_packages__package_id__get";
type LegacyConsultationsOperation = "consultations_api_v1_legacy_consultations_get";
type LegacyConsultationOperation = "consultation_api_v1_legacy_consultations__consultation_id__get";
type LegacyExpertsOperation = "experts_api_v1_legacy_experts_get";
type LegacyExpertOperation = "expert_api_v1_legacy_experts__expert_key__get";
type LegacyExpertRecommendationsOperation =
  "expert_recommendations_api_v1_legacy_experts__expert_key__recommendations_get";

export type LegacyRelatedParams = QueryParams<LegacyRelatedOperation>;
export type LegacyCourseParams = QueryParams<LegacyCourseOperation>;
export type LegacyRelatedResponse = SuccessResponse<LegacyRelatedOperation>;
export type LegacyRecommendationsParams = QueryParams<LegacyRecommendationsOperation>;
export type LegacyRecommendationsResponse = SuccessResponse<LegacyRecommendationsOperation>;
export type LandingPageResponse = SuccessResponse<LandingPageOperation>;
export type LandingInsightsResponse = SuccessResponse<LandingInsightsOperation>;
export type LegacyPageParams = QueryParams<LegacyCategoriesOperation>;
export type LegacyCategoriesResponse = SuccessResponse<LegacyCategoriesOperation>;
export type LegacyCategoryResponse = SuccessResponse<LegacyCategoryOperation>;
export type LegacyCategoryCoursesParams = QueryParams<LegacyCategoryCoursesOperation>;
export type LegacyCategoryCoursesResponse = SuccessResponse<LegacyCategoryCoursesOperation>;
export type LegacyCategoryInstructorsParams = QueryParams<LegacyCategoryInstructorsOperation>;
export type LegacyCategoryInstructorsResponse = SuccessResponse<LegacyCategoryInstructorsOperation>;
export type LegacyInstructorsParams = QueryParams<LegacyInstructorsOperation>;
export type LegacyInstructorsResponse = SuccessResponse<LegacyInstructorsOperation>;
export type LegacyInstructorResponse = SuccessResponse<LegacyInstructorOperation>;
export type LegacyInstructorCoursesParams = QueryParams<LegacyInstructorCoursesOperation>;
export type LegacyInstructorCoursesResponse = SuccessResponse<LegacyInstructorCoursesOperation>;
export type LegacyInstructorDiplomasParams = QueryParams<LegacyInstructorDiplomasOperation>;
export type LegacyInstructorDiplomasResponse = SuccessResponse<LegacyInstructorDiplomasOperation>;
export type LegacyInstructorPackagesParams = QueryParams<LegacyInstructorPackagesOperation>;
export type LegacyInstructorPackagesResponse = SuccessResponse<LegacyInstructorPackagesOperation>;
export type LegacyInstructorCategoriesParams = QueryParams<LegacyInstructorCategoriesOperation>;
export type LegacyInstructorCategoriesResponse = SuccessResponse<LegacyInstructorCategoriesOperation>;
export type LegacyCoursesParams = QueryParams<LegacyCoursesOperation>;
export type LegacyCoursesResponse = SuccessResponse<LegacyCoursesOperation>;
export type LegacyCourseResponse = SuccessResponse<LegacyCourseOperation>;
export type LegacyCoursePricesResponse = SuccessResponse<LegacyCoursePricesOperation>;
export type LegacyDiplomasParams = QueryParams<LegacyDiplomasOperation>;
export type LegacyDiplomasResponse = SuccessResponse<LegacyDiplomasOperation>;
export type LegacyDiplomaResponse = SuccessResponse<LegacyDiplomaOperation>;
export type LegacyPackagesParams = QueryParams<LegacyPackagesOperation>;
export type LegacyPackagesResponse = SuccessResponse<LegacyPackagesOperation>;
export type LegacyPackageResponse = SuccessResponse<LegacyPackageOperation>;
export type LegacyConsultationsParams = QueryParams<LegacyConsultationsOperation>;
export type LegacyConsultationsResponse = SuccessResponse<LegacyConsultationsOperation>;
export type LegacyConsultationResponse = SuccessResponse<LegacyConsultationOperation>;
export type LegacyExpertsParams = QueryParams<LegacyExpertsOperation>;
export type LegacyExpertsResponse = SuccessResponse<LegacyExpertsOperation>;
export type LegacyExpertResponse = SuccessResponse<LegacyExpertOperation>;
export type LegacyExpertRecommendationsParams = QueryParams<LegacyExpertRecommendationsOperation>;
