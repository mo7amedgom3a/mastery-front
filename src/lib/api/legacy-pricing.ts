import "server-only";

import type { ApiRequestOptions } from "@/lib/api/client";
import { getLegacyCoursePrices, type LegacyCoursesResponse } from "@/lib/api/legacy";
import { resolvePriceRows } from "@/lib/pricing";

type CourseDto = LegacyCoursesResponse["items"][number];
type PriceDto = NonNullable<CourseDto["current_price"]>;

/** Whether the list row carries no usable price (no price-list row, no positive bare price). */
function isUnpriced(dto: CourseDto): boolean {
  return !dto.current_price && !(dto.price && dto.price > 0);
}

/**
 * List endpoints only return the API's `current_price`, which is null when the main price was stored
 * with a past date window (e.g. course 10: 69, dated 2020-12-04 → 2020-12-04). For those rows only
 * (a handful), fetch the full price list and resolve it the same way the detail page does, so cards,
 * the cart and the detail page always agree. Failed lookups leave the row unpriced.
 */
export async function withResolvedPrices<T extends CourseDto>(items: readonly T[], options: ApiRequestOptions): Promise<T[]> {
  const unpriced = [...new Set(items.filter((dto) => dto.active && isUnpriced(dto)).map((dto) => dto.id))];
  if (unpriced.length === 0) {
    return [...items];
  }

  const results = await Promise.allSettled(unpriced.map((id) => getLegacyCoursePrices(id, options)));
  const resolved = new Map<number, { current: PriceDto | null; original: number | null }>();
  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      resolved.set(unpriced[index], resolvePriceRows(result.value));
    } else {
      console.error(`[api] course ${unpriced[index]} prices request failed`, result.reason);
    }
  });

  return items.map((dto) => {
    const prices = resolved.get(dto.id);
    return prices?.current && isUnpriced(dto)
      ? { ...dto, current_price: prices.current, original_price: prices.original }
      : dto;
  });
}
