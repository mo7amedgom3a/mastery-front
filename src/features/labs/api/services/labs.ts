import { queryOptions } from "@tanstack/react-query";

import { getLabTransport } from "../client";
import type { LabApiQuery, LabList, LabRecommendationSet, LabRuntime, LiveLabList, LiveLabRuntime } from "../contract";
import { labPaths } from "../endpoints";

export const labKeys = {
  all: ["labs"] as const,
  list: (query?: LabApiQuery) => [...labKeys.all, "list", query ?? {}] as const,
  detail: (slug: string) => [...labKeys.all, "detail", slug] as const,
  recommendations: (slug: string) => [...labKeys.all, "recommendations", slug] as const,
};

export async function listLabs(query?: LabApiQuery): Promise<LabList> {
  const transport = await getLabTransport();
  return transport.request<LabList>("GET", labPaths.listLabs, { query });
}

export async function getLab(slug: string, options: { preview?: boolean } = {}): Promise<LabRuntime> {
  const transport = await getLabTransport();
  return transport.request<LabRuntime>("GET", labPaths.getLab(slug), {
    query: options.preview ? { preview: 1 } : undefined,
  });
}

/** Live API: one published lab (or the draft, with an admin preview token) and one scenario. */
export async function getLiveLab(
  slug: string,
  options: { scenario?: string | null; previewToken?: string | null } = {},
): Promise<LiveLabRuntime> {
  const transport = await getLabTransport();
  return transport.request<LiveLabRuntime>("GET", labPaths.getLab(slug), {
    query: { scenario: options.scenario ?? undefined, preview: options.previewToken ?? undefined },
  });
}

/** Live API: published labs (with the learner's attempt count and best score). */
export async function listLiveLabs(): Promise<LiveLabList> {
  const transport = await getLabTransport();
  return transport.request<LiveLabList>("GET", labPaths.listLabs);
}

export async function getLabRecommendations(slug: string): Promise<LabRecommendationSet> {
  const transport = await getLabTransport();
  // The live module keeps recommendations in the lab definition (already in the runtime); products
  // come from the catalog fallback in `useLabRecommendations`. There is no per-lab endpoint yet.
  if (transport.mode === "live") {
    return { courses: [], diplomas: [], packages: [], bundles: [], consultations: [], live_diplomas: [], subscriptions: [] };
  }
  return transport.request<LabRecommendationSet>("GET", labPaths.recommendations(slug));
}

export const liveLabQueries = {
  list: () =>
    queryOptions({
      queryKey: [...labKeys.all, "live-list"],
      queryFn: () => listLiveLabs(),
      staleTime: 60_000,
    }),
  detail: (slug: string, scenario: string | null, previewToken: string | null) =>
    queryOptions({
      queryKey: [...labKeys.detail(slug), "live", scenario ?? "", previewToken ? "preview" : "public"],
      queryFn: () => getLiveLab(slug, { scenario, previewToken }),
      staleTime: previewToken ? 0 : 60_000,
      retry: 1,
    }),
};

export const labQueries = {
  list: (query?: LabApiQuery) =>
    queryOptions({
      queryKey: labKeys.list(query),
      queryFn: () => listLabs(query),
      staleTime: 5 * 60_000,
    }),
  detail: (slug: string, preview = false) =>
    queryOptions({
      queryKey: [...labKeys.detail(slug), preview ? "preview" : "public"],
      queryFn: () => getLab(slug, { preview }),
      staleTime: 60_000,
      retry: 1,
    }),
  recommendations: (slug: string) =>
    queryOptions({
      queryKey: labKeys.recommendations(slug),
      queryFn: () => getLabRecommendations(slug),
      staleTime: 5 * 60_000,
      retry: 1,
    }),
};
