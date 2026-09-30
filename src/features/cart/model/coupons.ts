import type { ShopItemKind } from "@/lib/shop/contract";

export type CouponDef = {
  /** Upper-case; codes are matched case-insensitively. */
  code: string;
  /** What the coupon gives, shown once it is applied. */
  label: string;
  type: "percent" | "fixed";
  /** Percent (0–100), or an amount in major units. */
  value: number;
  /**
   * `cart`: every eligible line shares the discount.
   * `line`: one product only — the most expensive eligible line.
   */
  scope: "cart" | "line";
  /** Limit to these product kinds. */
  kinds?: readonly ShopItemKind[];
  /** Limit to these products (`${kind}:${id}`). */
  keys?: readonly string[];
  /** Smallest sum of eligible products the coupon needs, in major units. */
  minSubtotal?: number;
  /** ISO date; the coupon stops working from then on. */
  endsAt?: string;
};

/**
 * MOCK: coupons to exercise every branch of the cart. A coupon discounts products, never add-ons,
 * and one coupon applies per order (the backend stores a single `applied_promotion_id`).
 * TODO(api): validate against `b2c.promotions` (type, value, `conditions_json`, usage limits, window).
 */
export const COUPONS: readonly CouponDef[] = [
  { code: "MASTERY10", label: "خصم 10٪ على كل منتجات السلة", type: "percent", value: 10, scope: "cart" },
  {
    code: "COURSE20",
    label: "خصم 20٪ على دورة واحدة (الأعلى سعراً في سلتك)",
    type: "percent",
    value: 20,
    scope: "line",
    kinds: ["course"],
  },
  {
    code: "DIPLOMA25",
    label: "خصم 25٪ على الدبلومات",
    type: "percent",
    value: 25,
    scope: "cart",
    kinds: ["diploma"],
  },
  {
    code: "WELCOME15",
    label: "خصم 15$ على طلبك",
    type: "fixed",
    value: 15,
    scope: "cart",
    minSubtotal: 100,
  },
  { code: "FREEPASS", label: "خصم 100٪ على كل منتجات السلة", type: "percent", value: 100, scope: "cart" },
  {
    code: "SUMMER24",
    label: "خصم 30٪ على كل منتجات السلة",
    type: "percent",
    value: 30,
    scope: "cart",
    endsAt: "2024-09-01T00:00:00Z",
  },
];

const CODE_PATTERN = /^[A-Z0-9_-]{2,40}$/;

/** Trimmed, upper-cased code; null when it can't be a coupon code at all. */
export function normalizeCouponCode(value: string | null | undefined): string | null {
  const code = value?.trim().toUpperCase();
  return code && CODE_PATTERN.test(code) ? code : null;
}

export function findCoupon(code: string): CouponDef | null {
  return COUPONS.find((coupon) => coupon.code === code) ?? null;
}
