import { queryOptions } from "@tanstack/react-query";

import { apiRequest, type ApiRequestOptions } from "@/lib/api/client";
import type { PathParams, QueryParams, SuccessResponse } from "@/lib/api/operation-types";

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

export type LegacyRelatedParams = QueryParams<LegacyRelatedOperation>;
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

const legacyPaths = {
  related: "/api/v1/legacy/resources/{resource_type}/{legacy_id}/related",
  recommendations: "/api/v1/legacy/resources/{resource_type}/{legacy_id}/recommendations",
  landingPage: "/api/v1/legacy/landing-page",
  insights: "/api/v1/legacy/insights",
  categories: "/api/v1/legacy/categories",
  category: "/api/v1/legacy/categories/{category_id}",
  categoryCourses: "/api/v1/legacy/categories/{category_id}/courses",
  categoryInstructors: "/api/v1/legacy/categories/{category_id}/instructors",
  instructors: "/api/v1/legacy/instructors",
  instructor: "/api/v1/legacy/instructors/{instructor_id}",
  instructorCourses: "/api/v1/legacy/instructors/{instructor_id}/courses",
  instructorDiplomas: "/api/v1/legacy/instructors/{instructor_id}/diplomas",
  instructorPackages: "/api/v1/legacy/instructors/{instructor_id}/packages",
  instructorCategories: "/api/v1/legacy/instructors/{instructor_id}/categories",
  courses: "/api/v1/legacy/courses",
  course: "/api/v1/legacy/courses/{course_id}",
  coursePrices: "/api/v1/legacy/courses/{course_id}/prices",
  diplomas: "/api/v1/legacy/diplomas",
  diploma: "/api/v1/legacy/diplomas/{diploma_id}",
  packages: "/api/v1/legacy/packages",
  package: "/api/v1/legacy/packages/{package_id}",
  consultations: "/api/v1/legacy/consultations",
  consultation: "/api/v1/legacy/consultations/{consultation_id}",
} as const;

export const legacyKeys = {
  all: ["legacy"] as const,
  landingPage: () => [...legacyKeys.all, "landing-page"] as const,
  insights: () => [...legacyKeys.all, "insights"] as const,
  list: (name: string, params?: object) => [...legacyKeys.all, name, params ?? {}] as const,
  detail: (name: string, id: string | number) => [...legacyKeys.all, name, id] as const,
  childList: (name: string, id: string | number, child: string, params?: object) =>
    [...legacyKeys.detail(name, id), child, params ?? {}] as const,
  related: (resourceType: string, legacyId: string, params?: LegacyRelatedParams) =>
    [...legacyKeys.all, "resources", resourceType, legacyId, "related", params ?? {}] as const,
  recommendations: (resourceType: string, legacyId: string, params?: LegacyRecommendationsParams) =>
    [...legacyKeys.all, "resources", resourceType, legacyId, "recommendations", params ?? {}] as const,
};

export function getLegacyRelatedResources(
  path: PathParams<LegacyRelatedOperation>,
  params?: LegacyRelatedParams,
  options?: ApiRequestOptions,
): Promise<LegacyRelatedResponse> {
  return apiRequest<LegacyRelatedResponse>("GET", legacyPaths.related, { ...options, path, query: params });
}

export function getLegacyResourceRecommendations(
  path: PathParams<LegacyRecommendationsOperation>,
  params?: LegacyRecommendationsParams,
  options?: ApiRequestOptions,
): Promise<LegacyRecommendationsResponse> {
  return apiRequest<LegacyRecommendationsResponse>("GET", legacyPaths.recommendations, {
    ...options,
    path,
    query: params,
  });
}

export function getLegacyLandingPage(options?: ApiRequestOptions): Promise<LandingPageResponse> {
  return apiRequest<LandingPageResponse>("GET", legacyPaths.landingPage, options);
}

export function getLegacyInsights(options?: ApiRequestOptions): Promise<LandingInsightsResponse> {
  return apiRequest<LandingInsightsResponse>("GET", legacyPaths.insights, options);
}

export function getLegacyCategories(
  params?: LegacyPageParams,
  options?: ApiRequestOptions,
): Promise<LegacyCategoriesResponse> {
  return apiRequest<LegacyCategoriesResponse>("GET", legacyPaths.categories, { ...options, query: params });
}

export function getLegacyCategory(
  categoryId: PathParams<LegacyCategoryOperation>["category_id"],
  options?: ApiRequestOptions,
): Promise<LegacyCategoryResponse> {
  return apiRequest<LegacyCategoryResponse>("GET", legacyPaths.category, {
    ...options,
    path: { category_id: categoryId },
  });
}

export function getLegacyCategoryCourses(
  categoryId: PathParams<LegacyCategoryCoursesOperation>["category_id"],
  params?: LegacyCategoryCoursesParams,
  options?: ApiRequestOptions,
): Promise<LegacyCategoryCoursesResponse> {
  return apiRequest<LegacyCategoryCoursesResponse>("GET", legacyPaths.categoryCourses, {
    ...options,
    path: { category_id: categoryId },
    query: params,
  });
}

export function getLegacyCategoryInstructors(
  categoryId: PathParams<LegacyCategoryInstructorsOperation>["category_id"],
  params?: LegacyCategoryInstructorsParams,
  options?: ApiRequestOptions,
): Promise<LegacyCategoryInstructorsResponse> {
  return apiRequest<LegacyCategoryInstructorsResponse>("GET", legacyPaths.categoryInstructors, {
    ...options,
    path: { category_id: categoryId },
    query: params,
  });
}

export function getLegacyInstructors(
  params?: LegacyInstructorsParams,
  options?: ApiRequestOptions,
): Promise<LegacyInstructorsResponse> {
  return apiRequest<LegacyInstructorsResponse>("GET", legacyPaths.instructors, { ...options, query: params });
}

export function getLegacyInstructor(
  instructorId: PathParams<LegacyInstructorOperation>["instructor_id"],
  options?: ApiRequestOptions,
): Promise<LegacyInstructorResponse> {
  return apiRequest<LegacyInstructorResponse>("GET", legacyPaths.instructor, {
    ...options,
    path: { instructor_id: instructorId },
  });
}

export function getLegacyInstructorCourses(
  instructorId: PathParams<LegacyInstructorCoursesOperation>["instructor_id"],
  params?: LegacyInstructorCoursesParams,
  options?: ApiRequestOptions,
): Promise<LegacyInstructorCoursesResponse> {
  return apiRequest<LegacyInstructorCoursesResponse>("GET", legacyPaths.instructorCourses, {
    ...options,
    path: { instructor_id: instructorId },
    query: params,
  });
}

export function getLegacyInstructorDiplomas(
  instructorId: PathParams<LegacyInstructorDiplomasOperation>["instructor_id"],
  params?: LegacyInstructorDiplomasParams,
  options?: ApiRequestOptions,
): Promise<LegacyInstructorDiplomasResponse> {
  return apiRequest<LegacyInstructorDiplomasResponse>("GET", legacyPaths.instructorDiplomas, {
    ...options,
    path: { instructor_id: instructorId },
    query: params,
  });
}

export function getLegacyInstructorPackages(
  instructorId: PathParams<LegacyInstructorPackagesOperation>["instructor_id"],
  params?: LegacyInstructorPackagesParams,
  options?: ApiRequestOptions,
): Promise<LegacyInstructorPackagesResponse> {
  return apiRequest<LegacyInstructorPackagesResponse>("GET", legacyPaths.instructorPackages, {
    ...options,
    path: { instructor_id: instructorId },
    query: params,
  });
}

export function getLegacyInstructorCategories(
  instructorId: PathParams<LegacyInstructorCategoriesOperation>["instructor_id"],
  params?: LegacyInstructorCategoriesParams,
  options?: ApiRequestOptions,
): Promise<LegacyInstructorCategoriesResponse> {
  return apiRequest<LegacyInstructorCategoriesResponse>("GET", legacyPaths.instructorCategories, {
    ...options,
    path: { instructor_id: instructorId },
    query: params,
  });
}

export function getLegacyCourses(params?: LegacyCoursesParams, options?: ApiRequestOptions): Promise<LegacyCoursesResponse> {
  return apiRequest<LegacyCoursesResponse>("GET", legacyPaths.courses, { ...options, query: params });
}

export function getLegacyCourse(
  courseId: PathParams<LegacyCourseOperation>["course_id"],
  options?: ApiRequestOptions,
): Promise<LegacyCourseResponse> {
  return apiRequest<LegacyCourseResponse>("GET", legacyPaths.course, { ...options, path: { course_id: courseId } });
}

export function getLegacyCoursePrices(
  courseId: PathParams<LegacyCoursePricesOperation>["course_id"],
  options?: ApiRequestOptions,
): Promise<LegacyCoursePricesResponse> {
  return apiRequest<LegacyCoursePricesResponse>("GET", legacyPaths.coursePrices, {
    ...options,
    path: { course_id: courseId },
  });
}

export function getLegacyDiplomas(
  params?: LegacyDiplomasParams,
  options?: ApiRequestOptions,
): Promise<LegacyDiplomasResponse> {
  return apiRequest<LegacyDiplomasResponse>("GET", legacyPaths.diplomas, { ...options, query: params });
}

export function getLegacyDiploma(
  diplomaId: PathParams<LegacyDiplomaOperation>["diploma_id"],
  options?: ApiRequestOptions,
): Promise<LegacyDiplomaResponse> {
  return apiRequest<LegacyDiplomaResponse>("GET", legacyPaths.diploma, {
    ...options,
    path: { diploma_id: diplomaId },
  });
}

export function getLegacyPackages(
  params?: LegacyPackagesParams,
  options?: ApiRequestOptions,
): Promise<LegacyPackagesResponse> {
  return apiRequest<LegacyPackagesResponse>("GET", legacyPaths.packages, { ...options, query: params });
}

export function getLegacyPackage(
  packageId: PathParams<LegacyPackageOperation>["package_id"],
  options?: ApiRequestOptions,
): Promise<LegacyPackageResponse> {
  return apiRequest<LegacyPackageResponse>("GET", legacyPaths.package, {
    ...options,
    path: { package_id: packageId },
  });
}

export function getLegacyConsultations(
  params?: LegacyConsultationsParams,
  options?: ApiRequestOptions,
): Promise<LegacyConsultationsResponse> {
  return apiRequest<LegacyConsultationsResponse>("GET", legacyPaths.consultations, { ...options, query: params });
}

export function getLegacyConsultation(
  consultationId: PathParams<LegacyConsultationOperation>["consultation_id"],
  options?: ApiRequestOptions,
): Promise<LegacyConsultationResponse> {
  return apiRequest<LegacyConsultationResponse>("GET", legacyPaths.consultation, {
    ...options,
    path: { consultation_id: consultationId },
  });
}

export const legacyQueries = {
  landingPage: () =>
    queryOptions({
      queryKey: legacyKeys.landingPage(),
      queryFn: ({ signal }) => getLegacyLandingPage({ signal }),
      staleTime: 5 * 60_000,
    }),
  insights: () =>
    queryOptions({
      queryKey: legacyKeys.insights(),
      queryFn: ({ signal }) => getLegacyInsights({ signal }),
      staleTime: 5 * 60_000,
    }),
  categories: (params?: LegacyPageParams) =>
    queryOptions({
      queryKey: legacyKeys.list("categories", params),
      queryFn: ({ signal }) => getLegacyCategories(params, { signal }),
      staleTime: 5 * 60_000,
    }),
  courses: (params?: LegacyCoursesParams) =>
    queryOptions({
      queryKey: legacyKeys.list("courses", params),
      queryFn: ({ signal }) => getLegacyCourses(params, { signal }),
      staleTime: 5 * 60_000,
    }),
  instructors: (params?: LegacyInstructorsParams) =>
    queryOptions({
      queryKey: legacyKeys.list("instructors", params),
      queryFn: ({ signal }) => getLegacyInstructors(params, { signal }),
      staleTime: 5 * 60_000,
    }),
  diplomas: (params?: LegacyDiplomasParams) =>
    queryOptions({
      queryKey: legacyKeys.list("diplomas", params),
      queryFn: ({ signal }) => getLegacyDiplomas(params, { signal }),
      staleTime: 5 * 60_000,
    }),
  packages: (params?: LegacyPackagesParams) =>
    queryOptions({
      queryKey: legacyKeys.list("packages", params),
      queryFn: ({ signal }) => getLegacyPackages(params, { signal }),
      staleTime: 5 * 60_000,
    }),
  consultations: (params?: LegacyConsultationsParams) =>
    queryOptions({
      queryKey: legacyKeys.list("consultations", params),
      queryFn: ({ signal }) => getLegacyConsultations(params, { signal }),
      staleTime: 5 * 60_000,
    }),
};
