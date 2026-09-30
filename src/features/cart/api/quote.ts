import "server-only";

import { z } from "zod";

import { siteConfig } from "@/config/site";
import {
  SHOP_KEY_PATTERN,
  type AddonCode,
  type PaymentMethodId,
  type Quote,
  type QuoteRequest,
} from "@/lib/shop/contract";

import { ADDON_CODES } from "../model/addons";
import { PAYMENT_METHOD_IDS } from "../model/payment-methods";
import { buildQuote, MAX_CART_LINES } from "../model/pricing";
import { MAX_RESOLVE_KEYS, resolveItems } from "./resolve-items";

const shopKey = z.string().regex(SHOP_KEY_PATTERN);
// Checked against the config lists, so a new add-on or payment method needs no change here.
const addonCode = z.custom<AddonCode>((value) => (ADDON_CODES as readonly unknown[]).includes(value));
const paymentMethodId = z.custom<PaymentMethodId>((value) => (PAYMENT_METHOD_IDS as readonly unknown[]).includes(value));

export const resolveSchema = z.object({ keys: z.array(shopKey).max(MAX_RESOLVE_KEYS) });

export const quoteSchema = z.object({
  lines: z.array(z.object({ key: shopKey, addons: z.array(addonCode).max(ADDON_CODES.length) })).max(MAX_CART_LINES),
  coupon: z.string().max(60).nullish(),
});

export const orderSchema = quoteSchema.extend({
  paymentMethod: paymentMethodId.nullable(),
  expectedTotal: z.number().finite().min(0),
  mockCustomer: z.boolean().optional(),
});

export const confirmSchema = z.object({ orderId: z.uuid(), outcome: z.enum(["success", "failure"]) });

/**
 * MOCK: prices a cart. The browser's own numbers are never trusted: every line is re-read from the
 * catalog, so the offer price, add-on prices and the coupon are decided here.
 * TODO(api): replace with the backend's cart/quote endpoint.
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
