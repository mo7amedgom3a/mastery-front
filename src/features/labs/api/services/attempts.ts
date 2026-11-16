import { queryOptions } from "@tanstack/react-query";

import { getLabTransport } from "../client";
import type { LabAttempt, LabAttemptList, LabInsights } from "../contract";
import { labPaths } from "../endpoints";

export const attemptKeys = {
  all: ["labs", "attempts"] as const,
  list: () => [...attemptKeys.all, "list"] as const,
  detail: (attemptId: string) => [...attemptKeys.all, "detail", attemptId] as const,
  insights: (range: string) => [...attemptKeys.all, "insights", range] as const,
};

export async function listLabAttempts(): Promise<LabAttemptList> {
  const transport = await getLabTransport();
  return transport.request<LabAttemptList>("GET", labPaths.attempts);
}

export async function getLabAttempt(attemptId: string): Promise<LabAttempt> {
  const transport = await getLabTransport();
  return transport.request<LabAttempt>("GET", labPaths.attempt(attemptId));
}

export async function getLabInsights(range = "365d"): Promise<LabInsights> {
  const transport = await getLabTransport();
  return transport.request<LabInsights>("GET", labPaths.insights, { query: { range } });
}

export async function resetLabAttempts(): Promise<{ ok: true }> {
  const transport = await getLabTransport();
  return transport.request<{ ok: true }>("DELETE", labPaths.attempts);
}

export async function seedDemoAttempts(): Promise<{ ok: true; attempts: number }> {
  const transport = await getLabTransport();
  return transport.request<{ ok: true; attempts: number }>("POST", labPaths.demo);
}

export const attemptQueries = {
  list: () =>
    queryOptions({
      queryKey: attemptKeys.list(),
      queryFn: () => listLabAttempts(),
      staleTime: 15_000,
    }),
  detail: (attemptId: string) =>
    queryOptions({
      queryKey: attemptKeys.detail(attemptId),
      queryFn: () => getLabAttempt(attemptId),
      staleTime: 60_000,
    }),
  insights: (range: string) =>
    queryOptions({
      queryKey: attemptKeys.insights(range),
      queryFn: () => getLabInsights(range),
      staleTime: 30_000,
    }),
};
