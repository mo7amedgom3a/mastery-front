import "server-only";

import { z } from "zod";

import { siteConfig } from "@/config/site";
import { SHOP_KEY_PATTERN, type AddonCode, type Quote, type QuoteRequest } from "@/lib/shop/contract";

import { getAddonOffers } from "@/lib/api/certificates";
import { catalogSlug } from "@/lib/shop/product-links";
import { parseShopKey } from "@/lib/shop/contract";

import { ADDON_CODES, isAddonCode, type AddonOfferDef } from "../model/addons";
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
  const keys = request.lines.map((line) => line.key);
  const [{ items }, offers] = await Promise.all([resolveItems(keys), addonOffers(keys)]);
  return buildQuote({
    lines: request.lines,
    items: new Map(items.map((item) => [item.key, item])),
    coupon: request.coupon,
    currency: siteConfig.currency,
    offers,
  });
}

/**
 * Certificate add-ons each product offers, priced by the backend (the account cart charges the same).
 * Without them the preview simply offers none.
 */
async function addonOffers(keys: string[]): Promise<Map<string, AddonOfferDef[]>> {
  const slugToKey = new Map(
    keys.flatMap((key) => {
      const parsed = parseShopKey(key);
      return parsed ? [[catalogSlug(parsed), key] as const] : [];
    }),
  );
  if (slugToKey.size === 0) return new Map();
  try {
    const { items } = await getAddonOffers([...slugToKey.keys()], { next: { revalidate: 60 } });
    return new Map(
      items.flatMap((entry) => {
        const key = slugToKey.get(entry.slug);
        if (!key) return [];
        const defs = entry.addons.flatMap((offer) =>
          isAddonCode(offer.code) && offer.currency.toUpperCase() === siteConfig.currency
            ? [
                {
                  code: offer.code,
                  title: offer.title,
                  description: offer.description ?? "",
                  amount: offer.amount_minor / 100,
                  requiresShipping: offer.requires_shipping,
                },
              ]
            : [],
        );
        return [[key, defs] as const];
      }),
    );
  } catch (error) {
    console.error("[cart] add-on offers unavailable", error);
    return new Map();
  }
}
