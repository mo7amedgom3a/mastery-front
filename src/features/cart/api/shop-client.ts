import { keepPreviousData, queryOptions } from "@tanstack/react-query";

import type { Quote, QuoteRequest, ResolveItemsResponse, ShopErrorBody, ShopErrorCode } from "@/lib/shop/contract";

/**
 * Browser client for this app's catalog-backed shop endpoints (`/api/shop/*`): artwork and links for
 * saved items, and a guest's cart preview. Orders and payments go to the backend (`lib/api/commerce`).
 */
const paths = {
  resolve: "/api/shop/items/resolve",
  quote: "/api/shop/cart/quote",
} as const;

export class ShopApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: ShopErrorCode | null,
    message: string,
    /** Sent with `price_changed`: the quote as it stands now. */
    public readonly quote?: Quote,
  ) {
    super(message);
    this.name = "ShopApiError";
  }
}

const FALLBACK_MESSAGE = "حدث خطأ غير متوقع. حاول مجدداً.";

async function post<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "same-origin",
    signal,
  });
  if (response.ok) {
    return (await response.json()) as T;
  }
  const error = (await response.json().catch(() => null)) as Partial<ShopErrorBody> | null;
  throw new ShopApiError(response.status, error?.code ?? null, error?.message ?? FALLBACK_MESSAGE, error?.quote);
}

export function resolveShopItems(keys: string[], signal?: AbortSignal): Promise<ResolveItemsResponse> {
  return post<ResolveItemsResponse>(paths.resolve, { keys }, signal);
}

export function getCartQuote(request: QuoteRequest, signal?: AbortSignal): Promise<Quote> {
  return post<Quote>(paths.quote, request, signal);
}

export const shopKeys = {
  all: ["shop"] as const,
  // Sorted: the same set of saved items is one cache entry whatever order it is listed in.
  items: (keys: string[]) => [...shopKeys.all, "items", keys.toSorted()] as const,
  quote: (request: QuoteRequest) => [...shopKeys.all, "quote", request] as const,
};

export const shopQueries = {
  items: (keys: string[]) =>
    queryOptions({
      queryKey: shopKeys.items(keys),
      queryFn: ({ signal }) => resolveShopItems(keys, signal),
      // Removing an item must not blank the page while the smaller list loads.
      placeholderData: keepPreviousData,
    }),
  quote: (request: QuoteRequest) =>
    queryOptions({
      queryKey: shopKeys.quote(request),
      queryFn: ({ signal }) => getCartQuote(request, signal),
      // The previous totals stay on screen (dimmed) while a change is re-priced.
      placeholderData: keepPreviousData,
    }),
};
