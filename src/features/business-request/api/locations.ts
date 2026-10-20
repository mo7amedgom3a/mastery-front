import { queryOptions } from "@tanstack/react-query";

export type Country = { code: string; name: string; nameEn: string; flag: string };

async function getJson<T>(path: string, signal: AbortSignal): Promise<T> {
  // Through this app's `/api/b2c` proxy: the country token stays on the backend.
  const response = await fetch(`/api/b2c/${path}`, { signal });
  if (!response.ok) throw new Error(`GET ${path} failed: ${response.status}`);
  return (await response.json()) as T;
}

export const locationQueries = {
  /** Every country, with its Arabic name. */
  countries: () =>
    queryOptions({
      queryKey: ["requests", "countries"] as const,
      queryFn: ({ signal }) => getJson<Country[]>("requests/countries", signal),
      staleTime: 24 * 60 * 60_000,
      retry: 1,
    }),
  /** Cities of one country (English names); empty when the lookup has none. */
  cities: (code: string) =>
    queryOptions({
      queryKey: ["requests", "countries", code, "cities"] as const,
      queryFn: ({ signal }) => getJson<string[]>(`requests/countries/${encodeURIComponent(code)}/cities`, signal),
      staleTime: 24 * 60 * 60_000,
      retry: 1,
    }),
};
