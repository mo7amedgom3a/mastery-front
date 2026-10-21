import { queryOptions } from "@tanstack/react-query";

export type Country = {
  code: string;
  name: string;
  nameEn: string;
  flag: string;
  flagUrl?: string;
  callingCode?: string;
};

export type PhoneCode = {
  code: string;
  name: string;
  nameEn: string;
  callingCode: string;
  flag: string;
  flagUrl?: string;
};

async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`/api/b2c/${path}`, { signal });
  if (!response.ok) throw new Error(`GET ${path} failed: ${response.status}`);
  return (await response.json()) as T;
}

export const locationQueries = {
  /** Every country, with its Arabic name, optionally filtered by language (e.g. "ara"). */
  countries: (lang?: string) =>
    queryOptions({
      queryKey: ["requests", "countries", lang ?? "all"] as const,
      queryFn: ({ signal }) =>
        getJson<Country[]>(`requests/countries${lang ? `?lang=${encodeURIComponent(lang)}` : ""}`, signal),
      staleTime: 24 * 60 * 60_000,
      retry: 1,
    }),
  /** Countries with their phone dialing codes. */
  phoneCodes: () =>
    queryOptions({
      queryKey: ["requests", "phone-codes"] as const,
      queryFn: ({ signal }) => getJson<PhoneCode[]>("requests/phone-codes", signal),
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
