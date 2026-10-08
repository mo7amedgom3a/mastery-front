import { formatPrice } from "@/lib/format";
import { toPricing, type Pricing } from "@/lib/pricing";

/**
 * MOCK: the public catalog does not expose a bundle's selling price yet (only the authenticated
 * checkout quote does). Until a read-only pricing API ships, bundles show these placeholder prices.
 * While this is true, prices stay out of structured data so search engines never index them.
 */
export const MOCK_PRICING = true;

/** USD, per catalog slug: what the learner pays now and the pre-offer price struck through. */
const MOCK_BUNDLE_PRICES: Record<string, { amount: number; original: number }> = {
  "ai-data-career-bundle": { amount: 450, original: 700 },
  "digital-marketing-ai-bundle": { amount: 390, original: 620 },
  "leadership-strategy-bundle": { amount: 420, original: 650 },
  "hr-talent-bundle": { amount: 350, original: 560 },
  "finance-analysis-bundle": { amount: 480, original: 750 },
};
const DEFAULT_PRICE = { amount: 450, original: 700 };

export type BundleSavings = { amount: string; percent: number };

export type BundlePricing = { price: Pricing; priceAmount: number; savings: BundleSavings | null };

export function bundlePricing(slug: string): BundlePricing {
  const { amount, original } = MOCK_BUNDLE_PRICES[slug] ?? DEFAULT_PRICE;
  const saved = formatPrice(original - amount);
  return {
    price: toPricing(amount, original),
    priceAmount: amount,
    savings: saved && original > amount ? { amount: saved, percent: Math.round(((original - amount) / original) * 100) } : null,
  };
}
