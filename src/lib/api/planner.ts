import { queryOptions } from "@tanstack/react-query";

import type { ApiRequestContext } from "@/lib/api/client";
import { apiRequest } from "@/lib/api/client";
import { customerRequest, withAuthCookies, type AuthenticatedRequestOptions } from "@/lib/api/customers";
import type { RequestBody, SuccessResponse } from "@/lib/api/operation-types";

type CalendarOperation = "planner_calendar";
type CreateItemOperation = "planner_create_item";
type UpdateItemOperation = "planner_update_item";
type ListPlansOperation = "planner_list_plans";
type CreatePlanOperation = "planner_create_plan";
type UpdatePlanOperation = "planner_update_plan";
type SettingsOperation = "planner_get_settings";
type UpdateSettingsOperation = "planner_update_settings";
type UnsubscribeOperation = "planner_unsubscribe";

export type PlannerCalendar = SuccessResponse<CalendarOperation>;
export type PlannerEvent = PlannerCalendar["events"][number];
export type PlannerEventSource = PlannerEvent["source"];
export type PlannerItem = SuccessResponse<CreateItemOperation>;
export type PlannerItemKind = PlannerItem["kind"];
export type CreatePlannerItemRequest = RequestBody<CreateItemOperation>;
export type UpdatePlannerItemRequest = RequestBody<UpdateItemOperation>;
export type PlannerPlan = SuccessResponse<ListPlansOperation>[number];
export type CreatePlannerPlanRequest = RequestBody<CreatePlanOperation>;
export type UpdatePlannerPlanRequest = RequestBody<UpdatePlanOperation>;
export type PlannerSettings = SuccessResponse<SettingsOperation>;
export type UpdatePlannerSettingsRequest = RequestBody<UpdateSettingsOperation>;
export type PlannerUnsubscribeResponse = SuccessResponse<UnsubscribeOperation>;

/** Window bounds as ISO strings with an offset; the backend allows at most 62 days. */
export type PlannerRange = { from: string; to: string };

const plannerPaths = {
  calendar: "/api/v1/me/planner/calendar",
  items: "/api/v1/me/planner/items",
  item: "/api/v1/me/planner/items/{item_id}",
  plans: "/api/v1/me/planner/plans",
  plan: "/api/v1/me/planner/plans/{plan_id}",
  settings: "/api/v1/me/planner/settings",
  unsubscribe: "/api/v1/planner/unsubscribe",
} as const;

export const plannerKeys = {
  all: ["planner"] as const,
  calendars: () => [...plannerKeys.all, "calendar"] as const,
  calendar: (range: PlannerRange) => [...plannerKeys.calendars(), range.from, range.to] as const,
  plans: () => [...plannerKeys.all, "plans"] as const,
  settings: () => [...plannerKeys.all, "settings"] as const,
};

export function getPlannerCalendar(range: PlannerRange, options?: AuthenticatedRequestOptions): Promise<PlannerCalendar> {
  return customerRequest<PlannerCalendar>("GET", plannerPaths.calendar, {
    ...withAuthCookies(options),
    query: { from: range.from, to: range.to },
  });
}

export function createPlannerItem(body: CreatePlannerItemRequest): Promise<PlannerItem> {
  return customerRequest<PlannerItem>("POST", plannerPaths.items, { ...withAuthCookies(), body });
}

export function updatePlannerItem(itemId: string, body: UpdatePlannerItemRequest): Promise<PlannerItem> {
  return customerRequest<PlannerItem>("PATCH", plannerPaths.item, {
    ...withAuthCookies(),
    path: { item_id: itemId },
    body,
  });
}

export function deletePlannerItem(itemId: string): Promise<void> {
  return customerRequest<void>("DELETE", plannerPaths.item, { ...withAuthCookies(), path: { item_id: itemId } });
}

export function listPlannerPlans(options?: AuthenticatedRequestOptions): Promise<PlannerPlan[]> {
  return customerRequest<PlannerPlan[]>("GET", plannerPaths.plans, withAuthCookies(options));
}

export function createPlannerPlan(body: CreatePlannerPlanRequest): Promise<PlannerPlan> {
  return customerRequest<PlannerPlan>("POST", plannerPaths.plans, { ...withAuthCookies(), body });
}

export function updatePlannerPlan(planId: string, body: UpdatePlannerPlanRequest): Promise<PlannerPlan> {
  return customerRequest<PlannerPlan>("PATCH", plannerPaths.plan, {
    ...withAuthCookies(),
    path: { plan_id: planId },
    body,
  });
}

export function deletePlannerPlan(planId: string): Promise<void> {
  return customerRequest<void>("DELETE", plannerPaths.plan, { ...withAuthCookies(), path: { plan_id: planId } });
}

export function getPlannerSettings(options?: AuthenticatedRequestOptions): Promise<PlannerSettings> {
  return customerRequest<PlannerSettings>("GET", plannerPaths.settings, withAuthCookies(options));
}

export function updatePlannerSettings(body: UpdatePlannerSettingsRequest): Promise<PlannerSettings> {
  return customerRequest<PlannerSettings>("PUT", plannerPaths.settings, { ...withAuthCookies(), body });
}

/** One-click unsubscribe from a reminder email link; no sign-in needed. */
export function unsubscribePlannerReminders(token: string): Promise<PlannerUnsubscribeResponse> {
  return apiRequest<PlannerUnsubscribeResponse>("POST", plannerPaths.unsubscribe, {
    body: { token },
    sameOrigin: typeof window !== "undefined",
  });
}

export const plannerQueries = {
  calendar: (range: PlannerRange, context?: ApiRequestContext) =>
    queryOptions({
      queryKey: plannerKeys.calendar(range),
      queryFn: ({ signal }) => getPlannerCalendar(range, { signal, context }),
      staleTime: 30_000,
    }),
  plans: (context?: ApiRequestContext) =>
    queryOptions({
      queryKey: plannerKeys.plans(),
      queryFn: ({ signal }) => listPlannerPlans({ signal, context }),
      staleTime: 30_000,
    }),
  settings: (context?: ApiRequestContext) =>
    queryOptions({
      queryKey: plannerKeys.settings(),
      queryFn: ({ signal }) => getPlannerSettings({ signal, context }),
      staleTime: 60_000,
    }),
};
