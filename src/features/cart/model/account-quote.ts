import type { CheckoutQuoteResponse } from "@/lib/api/commerce";
import { fromMinor } from "@/lib/format";
import { shopItemHref, shopKeyFromSlug } from "@/lib/shop/catalog-ids";
import { parseShopKey, type Quote, type QuoteLine, type ResolvedItem } from "@/lib/shop/contract";

/**
 * The backend's quote for the account cart, in the shape the cart UI renders (major units). Artwork
 * and links come from the catalog (`items`) when it has answered; the prices are always the
 * backend's, since that is what Stripe charges.
 */
export function accountQuote(quote: CheckoutQuoteResponse, items: ReadonlyMap<string, ResolvedItem>): Quote {
  const keysByProduct = new Map<string, string>();
  const lines: QuoteLine[] = (quote.lines ?? []).flatMap((line) => {
    const key = shopKeyFromSlug(line.slug);
    const parsed = key ? parseShopKey(key) : null;
    if (!key || !parsed) return [];
    keysByProduct.set(line.product_id, key);
    const unitAmount = fromMinor(line.unit_amount_minor);
    const resolved = items.get(key);
    const item: ResolvedItem = resolved ?? {
      key,
      kind: parsed.kind,
      id: parsed.id,
      title: line.title ?? line.slug,
      image: null,
      href: shopItemHref(parsed.kind, parsed.id),
      tag: null,
      instructor: null,
      duration: null,
      courseCount: null,
      available: true,
      free: false,
      priceAmount: unitAmount,
      originalAmount: null,
      purchasable: true,
    };
    return [
      {
        key,
        item,
        unitAmount,
        // The catalog's pre-offer price, shown struck through only while it is above what is charged.
        originalAmount: resolved?.originalAmount && resolved.originalAmount > unitAmount ? resolved.originalAmount : null,
        addons: [],
        addonsAmount: 0,
        discountAmount: 0,
        totalAmount: fromMinor(line.total_amount_minor),
      },
    ];
  });

  return {
    lines,
    unavailable: quote.unavailable_product_ids.flatMap((productId) => {
      const key = keysByProduct.get(productId);
      return key ? [{ key, reason: "unpriced" as const }] : [];
    }),
    coupon: null,
    totals: {
      currency: quote.currency_code,
      subtotal: fromMinor(quote.subtotal_amount_minor),
      // Informational, like the guest preview: what running offers take off the catalog prices.
      offerSavings: lines.reduce(
        (sum, line) => sum + (line.originalAmount === null ? 0 : line.originalAmount - line.unitAmount),
        0,
      ),
      discount: fromMinor(quote.discount_amount_minor),
      tax: fromMinor(quote.tax_amount_minor),
      total: fromMinor(quote.total_amount_minor),
    },
    paymentMethods: [],
  };
}
