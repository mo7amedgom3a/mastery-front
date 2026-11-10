import { queryOptions } from "@tanstack/react-query";

import type { ApiRequestContext } from "@/lib/api/client";
import { customerRequest, withAuthCookies, type AuthenticatedRequestOptions } from "@/lib/api/customers";
import type { RequestBody, SuccessResponse } from "@/lib/api/operation-types";

type OverviewOperation = "insights_overview";
type SummaryOperation = "insights_summary";
type HeartbeatOperation = "insights_heartbeat";

export type InsightsOverview = SuccessResponse<OverviewOperation>;
export type InsightsRange = InsightsOverview["range_key"];
export type InsightsActivity = InsightsOverview["activity"];
export type InsightsLearning = InsightsOverview["learning"];
export type InsightsLearningProduct = InsightsLearning["products"][number];
export type InsightsCategory = InsightsOverview["categories"][number];
export type InsightsInterest = InsightsOverview["interests"][number];
export type InsightsSkill = InsightsOverview["skills"][number];
export type InsightsPlannerWeek = InsightsOverview["planner"][number];
export type InsightsRecommendations = InsightsOverview["recommendations"];
export type InsightsProfile = InsightsOverview["profile"];
export type InsightsSummaryEnvelope = SuccessResponse<SummaryOperation>;
export type InsightsSummary = NonNullable<InsightsSummaryEnvelope["summary"]>;
export type HeartbeatRequest = RequestBody<HeartbeatOperation>;
export type ActivitySurface = HeartbeatRequest["surface"];

export const INSIGHTS_RANGES: readonly InsightsRange[] = ["30d", "90d", "365d"];

const insightsPaths = {
  overview: "/api/v1/me/insights",
  summary: "/api/v1/me/insights/summary",
  refreshSummary: "/api/v1/me/insights/summary/refresh",
  heartbeat: "/api/v1/me/activity/heartbeat",
} as const;

export const insightsKeys = {
  all: ["insights"] as const,
  overview: (range: InsightsRange) => [...insightsKeys.all, "overview", range] as const,
  summary: (range: InsightsRange) => [...insightsKeys.all, "summary", range] as const,
};

export function getInsightsOverview(range: InsightsRange, options?: AuthenticatedRequestOptions): Promise<InsightsOverview> {
  return customerRequest<InsightsOverview>("GET", insightsPaths.overview, {
    ...withAuthCookies(options),
    query: { range },
  });
}

export function getInsightsSummary(
  range: InsightsRange,
  options?: AuthenticatedRequestOptions,
): Promise<InsightsSummaryEnvelope> {
  return customerRequest<InsightsSummaryEnvelope>("GET", insightsPaths.summary, {
    ...withAuthCookies(options),
    query: { range },
  });
}

export function refreshInsightsSummary(range: InsightsRange): Promise<InsightsSummaryEnvelope> {
  return customerRequest<InsightsSummaryEnvelope>("POST", insightsPaths.refreshSummary, {
    ...withAuthCookies(),
    query: { range },
  });
}

/** Fire-and-forget active-time ping. `keepalive` lets the last one leave with a closing tab. */
export function sendActivityHeartbeat(body: HeartbeatRequest): Promise<void> {
  return customerRequest<void>("POST", insightsPaths.heartbeat, { ...withAuthCookies(), body, keepalive: true });
}

export const insightsQueries = {
  overview: (range: InsightsRange, context?: ApiRequestContext) =>
    queryOptions({
      queryKey: insightsKeys.overview(range),
      queryFn: ({ signal }) => getInsightsOverview(range, { signal, context }),
      staleTime: 60_000,
      retry: 1,
    }),
  summary: (range: InsightsRange, context?: ApiRequestContext) =>
    queryOptions({
      queryKey: insightsKeys.summary(range),
      queryFn: ({ signal }) => getInsightsSummary(range, { signal, context }),
      // Written by an LLM and cached server-side for a day; no need to ask again soon.
      staleTime: 10 * 60_000,
      retry: false,
    }),
};
