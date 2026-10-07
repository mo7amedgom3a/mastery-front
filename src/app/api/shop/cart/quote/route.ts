import type { NextRequest } from "next/server";

import { getQuote, quoteSchema } from "@/features/cart/api/quote";
import { catalogUnavailable, readBody, shopJson } from "@/features/cart/api/respond";

/**
 * Prices a guest's cart for display (current offer prices and totals). Nothing is bought against
 * this: signing in moves the cart to the account, where the backend prices and charges it.
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
