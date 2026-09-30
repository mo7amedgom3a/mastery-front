import type {
  AddonCode,
  PaymentMethodOption,
  Quote,
  QuoteAddon,
  QuoteCoupon,
  QuoteLine,
  QuoteLineRequest,
  ResolvedItem,
} from "@/lib/shop/contract";

import { addonsFor } from "./addons";
import { findCoupon, normalizeCouponCode, type CouponDef } from "./coupons";
import { PAYMENT_METHODS } from "./payment-methods";

/**
 * MOCK pricing engine: turns cart lines into a quote (line prices, add-ons, coupon, totals, payment
 * eligibility). Pure, so it is testable without a server (`npm run test:cart`).
 *
 * Server-side only: it carries the coupon list, which must not ship to the browser. The browser
 * gets quotes from `POST /api/shop/cart/quote`.
 * TODO(api): the backend's checkout module replaces this.
 */

/** A cart can't grow past this; more lines are ignored. */
export const MAX_CART_LINES = 50;

export type QuoteInput = {
  lines: readonly QuoteLineRequest[];
  /** Catalog state of the requested keys; a key absent from here is unknown to the catalog. */
  items: ReadonlyMap<string, ResolvedItem>;
  coupon?: string | null;
  currency: string;
  /** Epoch ms; injectable for tests. */
  now?: number;
};

// All arithmetic is in minor units (cents): percentages and splits never drift by a float error.
const toMinor = (amount: number) => Math.round(amount * 100);
const toMajor = (minor: number) => minor / 100;

type Working = {
  key: string;
  item: ResolvedItem;
  unit: number;
  original: number | null;
  addons: (QuoteAddon & { minor: number })[];
  addonsTotal: number;
  discount: number;
};

function unavailableReason(item: ResolvedItem | undefined): Quote["unavailable"][number]["reason"] | null {
  if (!item) return "missing";
  if (!item.available) return "inactive";
  if (item.kind === "consultation") return "not_purchasable";
  if (item.free) return "free";
  if (item.priceAmount === null || item.priceAmount <= 0) return "unpriced";
  return item.purchasable ? null : "not_purchasable";
}

function money(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  }).format(amount);
}

/** Splits `total` over `weights` in proportion, in whole cents, summing to exactly `total`. */
function splitProportionally(total: number, weights: readonly number[]): number[] {
  const base = weights.reduce((sum, weight) => sum + weight, 0);
  if (base <= 0) return weights.map(() => 0);
  const shares = weights.map((weight) => Math.floor((total * weight) / base));
  let remainder = total - shares.reduce((sum, share) => sum + share, 0);
  // Leftover cents go to the largest lines first; never past a line's own price.
  const order = weights.map((weight, index) => ({ weight, index })).sort((a, b) => b.weight - a.weight);
  for (let turn = 0; remainder > 0 && turn < order.length * 2; turn++) {
    const { index, weight } = order[turn % order.length];
    if (shares[index] < weight) {
      shares[index] += 1;
      remainder -= 1;
    }
  }
  return shares;
}

function eligibleFor(coupon: CouponDef, lines: readonly Working[]): Working[] {
  const matching = lines.filter(
    (line) =>
      (!coupon.kinds || coupon.kinds.includes(line.item.kind)) && (!coupon.keys || coupon.keys.includes(line.key)),
  );
  if (coupon.scope === "cart" || matching.length === 0) return matching;
  // One product only: the most expensive eligible line (the first one on a tie).
  return [matching.reduce((best, line) => (line.unit > best.unit ? line : best))];
}

function applyCoupon(
  rawCode: string | null | undefined,
  lines: Working[],
  currency: string,
  now: number,
): QuoteCoupon | null {
  if (rawCode === null || rawCode === undefined || rawCode.trim() === "") return null;

  const rejected = (code: string, status: QuoteCoupon["status"], message: string): QuoteCoupon => ({
    code,
    status,
    message,
    scope: null,
    discountAmount: 0,
    appliedKeys: [],
  });

  const code = normalizeCouponCode(rawCode);
  const coupon = code ? findCoupon(code) : null;
  if (!code || !coupon) {
    return rejected(rawCode.trim().slice(0, 40), "invalid", "رمز القسيمة غير صحيح. تحقّق من كتابته وحاول مجدداً.");
  }
  if (coupon.endsAt && Date.parse(coupon.endsAt) <= now) {
    return rejected(code, "expired", "انتهت صلاحية هذه القسيمة.");
  }

  const eligible = eligibleFor(coupon, lines);
  if (eligible.length === 0) {
    return rejected(code, "not_applicable", "هذه القسيمة لا تنطبق على المنتجات الموجودة في سلتك.");
  }

  const base = eligible.reduce((sum, line) => sum + line.unit, 0);
  if (coupon.minSubtotal !== undefined && base < toMinor(coupon.minSubtotal)) {
    return rejected(
      code,
      "min_not_met",
      `تعمل هذه القسيمة مع مشتريات بقيمة ${money(coupon.minSubtotal, currency)} أو أكثر.`,
    );
  }

  const shares =
    coupon.type === "percent"
      ? eligible.map((line) => Math.round((line.unit * Math.min(Math.max(coupon.value, 0), 100)) / 100))
      : splitProportionally(
          Math.min(toMinor(coupon.value), base),
          eligible.map((line) => line.unit),
        );
  eligible.forEach((line, index) => {
    line.discount = Math.min(shares[index], line.unit);
  });

  return {
    code,
    status: "applied",
    message: coupon.label,
    scope: coupon.scope,
    discountAmount: toMajor(eligible.reduce((sum, line) => sum + line.discount, 0)),
    appliedKeys: eligible.map((line) => line.key),
  };
}

function paymentOptions(total: number, currency: string): PaymentMethodOption[] {
  return PAYMENT_METHODS.map((method) => {
    const amount = toMajor(total);
    const tooLow = method.min !== undefined && amount < method.min;
    const tooHigh = method.max !== undefined && amount > method.max;
    const eligible = total > 0 && !tooLow && !tooHigh;
    const reason =
      total > 0 && (tooLow || tooHigh) && method.min !== undefined && method.max !== undefined
        ? `متاح للطلبات من ${money(method.min, currency)} إلى ${money(method.max, currency)}.`
        : null;
    const installments =
      eligible && method.installments
        ? { count: method.installments, amount: toMajor(Math.ceil(total / method.installments)) }
        : null;
    return { id: method.id, eligible, reason, installments };
  });
}

export function buildQuote({ lines: requested, items, coupon, currency, now = Date.now() }: QuoteInput): Quote {
  const unavailable: Quote["unavailable"] = [];
  const working: Working[] = [];
  const seen = new Set<string>();

  for (const request of requested.slice(0, MAX_CART_LINES)) {
    if (seen.has(request.key)) continue;
    seen.add(request.key);

    const item = items.get(request.key);
    const reason = unavailableReason(item);
    if (reason || !item || item.priceAmount === null) {
      unavailable.push({ key: request.key, reason: reason ?? "unpriced" });
      continue;
    }

    const chosen = new Set<AddonCode>(request.addons);
    const addons = addonsFor(item.kind).map(({ def, amount }) => ({
      code: def.code,
      title: def.title,
      description: def.description,
      amount,
      selected: chosen.has(def.code),
      minor: toMinor(amount),
    }));
    const unit = toMinor(item.priceAmount);
    const original = item.originalAmount !== null ? toMinor(item.originalAmount) : null;
    working.push({
      key: request.key,
      item,
      unit,
      original: original !== null && original > unit ? original : null,
      addons,
      addonsTotal: addons.reduce((sum, addon) => sum + (addon.selected ? addon.minor : 0), 0),
      discount: 0,
    });
  }

  const quoteCoupon = working.length > 0 ? applyCoupon(coupon, working, currency, now) : null;

  const subtotal = working.reduce((sum, line) => sum + line.unit + line.addonsTotal, 0);
  const discount = working.reduce((sum, line) => sum + line.discount, 0);
  const offerSavings = working.reduce((sum, line) => sum + (line.original !== null ? line.original - line.unit : 0), 0);
  const total = subtotal - discount;

  const lines: QuoteLine[] = working.map((line) => ({
    key: line.key,
    item: line.item,
    unitAmount: toMajor(line.unit),
    originalAmount: line.original !== null ? toMajor(line.original) : null,
    addons: line.addons.map(({ code, title, description, amount, selected }) => ({
      code,
      title,
      description,
      amount,
      selected,
    })),
    addonsAmount: toMajor(line.addonsTotal),
    discountAmount: toMajor(line.discount),
    totalAmount: toMajor(line.unit + line.addonsTotal - line.discount),
  }));

  return {
    lines,
    unavailable,
    coupon: quoteCoupon,
    totals: {
      currency,
      subtotal: toMajor(subtotal),
      offerSavings: toMajor(offerSavings),
      discount: toMajor(discount),
      // TODO(api): VAT rules are a backend decision (`b2c.orders.tax_amount`); prices are shown tax-free for now.
      tax: 0,
      total: toMajor(total),
    },
    paymentMethods: paymentOptions(total, currency),
  };
}
