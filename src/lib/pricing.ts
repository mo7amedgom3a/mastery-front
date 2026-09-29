import { formatPrice } from "@/lib/format";

/** What a card shows in its price slot. */
export type Pricing = {
  /** What the learner pays now, formatted. Null when the price is unknown or free. */
  current: string | null;
  /** Pre-offer price, formatted; set only while an offer undercuts it. Rendered struck through. */
  original: string | null;
  /** An explicit zero price: shown as "مجاني" with an enrol action instead of the cart. */
  free: boolean;
};

export const noPricing: Pricing = { current: null, original: null, free: false };

/**
 * `current` must come from a real price row: only an explicit `0` means free. A missing price
 * (null/undefined) stays unknown, so legacy placeholder zeros must be dropped before calling this.
 */
export function toPricing(current: number | null | undefined, original?: number | null): Pricing {
  if (current === null || current === undefined || !Number.isFinite(current) || current < 0) {
    return noPricing;
  }
  const struck = original && original > current ? formatPrice(original) : null;
  if (current === 0) {
    return { current: null, original: struck, free: true };
  }
  return { current: formatPrice(current), original: struck, free: false };
}
