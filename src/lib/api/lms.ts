import { queryOptions } from "@tanstack/react-query";

import { ApiError, apiRequest } from "@/lib/api/client";
import {
  customerRequest,
  withAuthCookies,
  type AuthenticatedRequestOptions,
} from "@/lib/api/customers";
import type { QueryParams, SuccessResponse } from "@/lib/api/operation-types";
import { refreshOnce } from "@/lib/auth/client";

/** Where to send the browser. The legacy token itself never reaches JavaScript. */
export type LmsLaunchResult = { mode: "cookie" | "login"; redirectUrl: string };

type LmsSummaryOperation = "lms_summary_api_v1_me_lms_summary_get";
type LmsCoursesOperation = "lms_courses_api_v1_me_lms_courses_get";
type LmsQuizzesOperation = "lms_quizzes_api_v1_me_lms_quizzes_get";

export type LmsSummary = SuccessResponse<LmsSummaryOperation>;
export type LmsCoursePage = SuccessResponse<LmsCoursesOperation>;
export type LmsCourse = LmsCoursePage["items"][number];
export type LmsQuizList = SuccessResponse<LmsQuizzesOperation>;
export type LmsQuiz = LmsQuizList["items"][number];
export type LmsCoursesParams = QueryParams<LmsCoursesOperation>;

const LAUNCH_PATH = "/api/lms/launch";
const lmsPaths = {
  summary: "/api/v1/me/lms/summary",
  courses: "/api/v1/me/lms/courses",
  quizzes: "/api/v1/me/lms/quizzes",
} as const;

export const lmsKeys = {
  all: ["lms"] as const,
  summary: () => [...lmsKeys.all, "summary"] as const,
  courses: (params?: LmsCoursesParams) => [...lmsKeys.all, "courses", params ?? {}] as const,
  quizzes: () => [...lmsKeys.all, "quizzes"] as const,
};

/**
 * Asks this app for the LMS hand-off (`app/api/lms/launch`), which also sets the LMS session
 * cookie. An expired access token is renewed once and the call repeated.
 */
export async function launchLms(entitlementId: string): Promise<LmsLaunchResult> {
  const options = { body: { entitlementId }, sameOrigin: true, credentials: "same-origin" as const };
  try {
    return await apiRequest<LmsLaunchResult>("POST", LAUNCH_PATH, options);
  } catch (error) {
    if (!(error instanceof ApiError && error.status === 401)) throw error;
    if (!(await refreshOnce())) throw error;
    return apiRequest<LmsLaunchResult>("POST", LAUNCH_PATH, options);
  }
}

export function getLmsSummary(options?: AuthenticatedRequestOptions): Promise<LmsSummary> {
  return customerRequest<LmsSummary>("GET", lmsPaths.summary, withAuthCookies(options));
}

export function listLmsCourses(
  params?: LmsCoursesParams,
  options?: AuthenticatedRequestOptions,
): Promise<LmsCoursePage> {
  return customerRequest<LmsCoursePage>("GET", lmsPaths.courses, {
    ...withAuthCookies(options),
    query: params,
  });
}

export function listLmsQuizzes(options?: AuthenticatedRequestOptions): Promise<LmsQuizList> {
  return customerRequest<LmsQuizList>("GET", lmsPaths.quizzes, withAuthCookies(options));
}

export const lmsQueries = {
  summary: () =>
    queryOptions({
      queryKey: lmsKeys.summary(),
      queryFn: ({ signal }) => getLmsSummary({ signal }),
      staleTime: 60_000,
      retry: 1,
    }),
  courses: (params?: LmsCoursesParams) =>
    queryOptions({
      queryKey: lmsKeys.courses(params),
      queryFn: ({ signal }) => listLmsCourses(params, { signal }),
      staleTime: 60_000,
      retry: 1,
    }),
  quizzes: () =>
    queryOptions({
      queryKey: lmsKeys.quizzes(),
      queryFn: ({ signal }) => listLmsQuizzes({ signal }),
      staleTime: 60_000,
      retry: 1,
    }),
};

/** The structured LMS error code, when the backend sent one. */
export function lmsErrorCode(error: unknown): string | null {
  if (!(error instanceof ApiError)) return null;
  const detail = error.details.detail;
  if (detail && typeof detail === "object" && "code" in detail) {
    return String((detail as { code: unknown }).code);
  }
  return null;
}

export function isLmsReauthError(error: unknown): boolean {
  return lmsErrorCode(error) === "lms_reauth_required";
}

export function isLmsIdentityError(error: unknown): boolean {
  const code = lmsErrorCode(error);
  return code === "lms_identity_missing" || code === "lms_identity_mismatch";
}

/** Product types whose access is delivered by the LMS (the rest open their catalog page). */
export const LMS_PRODUCT_TYPES = new Set(["course", "diploma", "package"]);
