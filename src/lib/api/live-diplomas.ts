import { queryOptions } from "@tanstack/react-query";

import { apiRequest, type ApiRequestOptions } from "@/lib/api/client";
import {
  customerRequest,
  withAuthCookies,
  type AuthenticatedRequestOptions,
} from "@/lib/api/customers";
import type { PathParams, RequestBody, SuccessResponse } from "@/lib/api/operation-types";

type ListLiveDiplomasOperation = "list_live_diplomas_api_v1_catalog_live_diplomas_get";
type GetLiveDiplomaOperation = "get_live_diploma_api_v1_catalog_live_diplomas__slug__get";
type ListCohortsOperation = "list_cohorts_api_v1_catalog_live_diplomas__slug__cohorts_get";
type GetCohortOperation = "get_cohort_api_v1_catalog_live_diplomas__slug__cohorts__cohort_id__get";
type JoinWaitlistOperation = "join_waitlist_api_v1_catalog_live_diplomas__slug__waitlist_post";
type MyWaitlistOperation = "my_waitlist_api_v1_catalog_live_diplomas__slug__waitlist_me_get";

export type LiveDiploma = SuccessResponse<GetLiveDiplomaOperation>;
export type LiveDiplomaListItem = SuccessResponse<ListLiveDiplomasOperation>[number];
export type Cohort = SuccessResponse<ListCohortsOperation>[number];
export type WaitlistEntry = SuccessResponse<MyWaitlistOperation>;
export type JoinWaitlistBody = RequestBody<JoinWaitlistOperation>;

const liveDiplomaPaths = {
  list: "/api/v1/catalog/live-diplomas",
  detail: "/api/v1/catalog/live-diplomas/{slug}",
  cohorts: "/api/v1/catalog/live-diplomas/{slug}/cohorts",
  cohort: "/api/v1/catalog/live-diplomas/{slug}/cohorts/{cohort_id}",
  waitlist: "/api/v1/catalog/live-diplomas/{slug}/waitlist",
  myWaitlist: "/api/v1/catalog/live-diplomas/{slug}/waitlist/me",
} as const;

export const liveDiplomaKeys = {
  all: ["live-diplomas"] as const,
  list: () => [...liveDiplomaKeys.all, "list"] as const,
  detail: (slug: string) => [...liveDiplomaKeys.all, "detail", slug] as const,
  cohorts: (slug: string) => [...liveDiplomaKeys.detail(slug), "cohorts"] as const,
  myWaitlist: (slug: string) => [...liveDiplomaKeys.detail(slug), "waitlist", "me"] as const,
};

/** Browser reads go through this app so the backend cookies/session are shared. */
function viaApp(options?: ApiRequestOptions): ApiRequestOptions {
  return typeof window === "undefined" ? (options ?? {}) : { ...options, sameOrigin: true };
}

export function listLiveDiplomas(options?: ApiRequestOptions): Promise<LiveDiplomaListItem[]> {
  return apiRequest<LiveDiplomaListItem[]>("GET", liveDiplomaPaths.list, viaApp(options));
}

export function getLiveDiploma(slug: string, options?: ApiRequestOptions): Promise<LiveDiploma> {
  return apiRequest<LiveDiploma>("GET", liveDiplomaPaths.detail, {
    ...viaApp(options),
    path: { slug },
  });
}

export function listCohorts(slug: string, options?: ApiRequestOptions): Promise<Cohort[]> {
  return apiRequest<Cohort[]>("GET", liveDiplomaPaths.cohorts, {
    ...viaApp(options),
    path: { slug },
  });
}

export function getCohort(
  slug: string,
  cohortId: PathParams<GetCohortOperation>["cohort_id"],
  options?: ApiRequestOptions,
): Promise<Cohort> {
  return apiRequest<Cohort>("GET", liveDiplomaPaths.cohort, {
    ...viaApp(options),
    path: { slug, cohort_id: cohortId },
  });
}

export function joinWaitlist(
  slug: string,
  body: JoinWaitlistBody,
  options?: AuthenticatedRequestOptions,
): Promise<WaitlistEntry> {
  return customerRequest<WaitlistEntry>("POST", liveDiplomaPaths.waitlist, {
    ...withAuthCookies(options),
    path: { slug },
    body,
  });
}

export function getMyWaitlist(slug: string, options?: AuthenticatedRequestOptions): Promise<WaitlistEntry | null> {
  return customerRequest<WaitlistEntry | null>("GET", liveDiplomaPaths.myWaitlist, {
    ...withAuthCookies(options),
    path: { slug },
  });
}

export function leaveWaitlist(slug: string, options?: AuthenticatedRequestOptions): Promise<void> {
  return customerRequest<void>("DELETE", liveDiplomaPaths.myWaitlist, {
    ...withAuthCookies(options),
    path: { slug },
  });
}

export const liveDiplomaQueries = {
  list: () =>
    queryOptions({
      queryKey: liveDiplomaKeys.list(),
      queryFn: ({ signal }) => listLiveDiplomas({ signal }),
      staleTime: 5 * 60_000,
    }),
  detail: (slug: string) =>
    queryOptions({
      queryKey: liveDiplomaKeys.detail(slug),
      queryFn: ({ signal }) => getLiveDiploma(slug, { signal }),
      staleTime: 5 * 60_000,
    }),
  cohorts: (slug: string) =>
    queryOptions({
      queryKey: liveDiplomaKeys.cohorts(slug),
      queryFn: ({ signal }) => listCohorts(slug, { signal }),
      staleTime: 60_000,
    }),
  myWaitlist: (slug: string) =>
    queryOptions({
      queryKey: liveDiplomaKeys.myWaitlist(slug),
      queryFn: ({ signal }) => getMyWaitlist(slug, { signal }),
      staleTime: 30_000,
    }),
};
