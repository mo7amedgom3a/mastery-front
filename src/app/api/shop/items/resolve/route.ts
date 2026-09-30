import type { NextRequest } from "next/server";

import { resolveSchema } from "@/features/cart/api/quote";
import { resolveItems } from "@/features/cart/api/resolve-items";
import { catalogUnavailable, readBody, shopJson } from "@/features/cart/api/respond";

/**
 * MOCK: the catalog's current view of saved items (wishlist and cart keys live in the browser):
 * titles, artwork, links and the price that applies now.
 * TODO(api): the B2C wishlist/cart endpoints will return priced items themselves.
 */
export async function POST(request: NextRequest) {
  const body = await readBody(request, resolveSchema);
  if ("error" in body) return body.error;
  try {
    return shopJson(await resolveItems(body.data.keys));
  } catch (error) {
    return catalogUnavailable(error);
  }
}
