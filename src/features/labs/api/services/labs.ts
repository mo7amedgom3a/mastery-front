import { queryOptions } from "@tanstack/react-query";

import { getLabTransport } from "../client";
import type { LabApiQuery, LabList, LabRecommendationSet, LabRuntime } from "../contract";
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

export async function getLabRecommendations(slug: string): Promise<LabRecommendationSet> {
  const transport = await getLabTransport();
  return transport.request<LabRecommendationSet>("GET", labPaths.recommendations(slug));
}

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
