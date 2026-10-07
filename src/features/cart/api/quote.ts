import "server-only";

import { z } from "zod";

import { siteConfig } from "@/config/site";
import { SHOP_KEY_PATTERN, type AddonCode, type Quote, type QuoteRequest } from "@/lib/shop/contract";

import { ADDON_CODES } from "../model/addons";
import { buildQuote, MAX_CART_LINES } from "../model/pricing";
import { MAX_RESOLVE_KEYS, resolveItems } from "./resolve-items";

const shopKey = z.string().regex(SHOP_KEY_PATTERN);
// Checked against the config list, so a new add-on needs no change here.
const addonCode = z.custom<AddonCode>((value) => (ADDON_CODES as readonly unknown[]).includes(value));

export const resolveSchema = z.object({ keys: z.array(shopKey).max(MAX_RESOLVE_KEYS) });

export const quoteSchema = z.object({
  lines: z.array(z.object({ key: shopKey, addons: z.array(addonCode).max(ADDON_CODES.length) })).max(MAX_CART_LINES),
  coupon: z.string().max(60).nullish(),
});

/**
 * A guest's cart preview: every line is re-read from the catalog, so the offer price is what shows.
 * Signed-in customers are priced by the backend (`POST /checkout/quote`), which is also what charges.
 */
export async function getQuote(request: QuoteRequest): Promise<Quote> {
  const { items } = await resolveItems(request.lines.map((line) => line.key));
  return buildQuote({
    lines: request.lines,
    items: new Map(items.map((item) => [item.key, item])),
    coupon: request.coupon,
    currency: siteConfig.currency,
  });
}
