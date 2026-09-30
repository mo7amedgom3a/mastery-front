import type { NextRequest } from "next/server";

import { getQuote, quoteSchema } from "@/features/cart/api/quote";
import { catalogUnavailable, readBody, shopJson } from "@/features/cart/api/respond";

/**
 * MOCK: prices the cart the browser holds — current (offer) prices, add-ons, the coupon, totals and
 * which payment methods fit the order.
 * TODO(api): replace with the backend's cart/quote endpoint.
 */
export async function POST(request: NextRequest) {
  const body = await readBody(request, quoteSchema);
  if ("error" in body) return body.error;
  try {
    return shopJson(await getQuote(body.data));
  } catch (error) {
    return catalogUnavailable(error);
  }
}
