import { formatPrice } from "@/lib/format";
import { toPricing, type Pricing } from "@/lib/pricing";

export type BundleSavings = { amount: string; percent: number };
export type BundlePricing = { price: Pricing; priceAmount: number | null; savings: BundleSavings | null };

/** The price fields the public bundle detail exposes (`price` on `ProductDetailResponse`). */
type BundlePrice = { amount?: number | null; compare_at_amount?: number | null } | null | undefined;

/**
 * The bundle's own catalog price, as edited in the admin's bundle tab. A struck-through price is shown
 * only when the catalog marks a higher pre-offer amount; otherwise there is no "savings" claim.
 */
export function bundlePricing(price: BundlePrice): BundlePricing {
  const amount = price?.amount ?? null;
  const original = price?.compare_at_amount ?? null;
  const saved = amount !== null && original !== null && original > amount ? original - amount : null;
  return {
    price: toPricing(amount, original),
    priceAmount: amount,
    savings:
      saved !== null && original !== null
        ? { amount: formatPrice(saved) ?? "", percent: Math.round((saved / original) * 100) }
        : null,
  };
}
