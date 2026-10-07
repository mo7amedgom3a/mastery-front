/**
 * The shop API contract: what the browser sends to, and gets from, `/api/shop/*`.
 *
 * These endpoints are served by this app (see `src/app/api/shop`) from the catalog: item artwork and
 * links, and a guest's cart preview. A signed-in customer's cart, orders and payments are the
 * backend's (`lib/api/commerce`); the cart page maps the backend quote onto `Quote` so one UI shows both.
 *
 * Amounts are numbers in major units of `currency`, with at most two decimals.
 */

export type ShopItemKind = "course" | "diploma" | "package" | "consultation";

/** Stable item key: `${kind}:${legacyId}` (legacy ids collide across kinds). */
export type ShopItemKey = string;

export const SHOP_KEY_PATTERN = /^(course|diploma|package|consultation):([1-9]\d{0,9})$/;

export function parseShopKey(key: string): { kind: ShopItemKind; id: number } | null {
  const match = key.match(SHOP_KEY_PATTERN);
  return match ? { kind: match[1] as ShopItemKind, id: Number(match[2]) } : null;
}

/** Paid extras attached to one cart line. */
export type AddonCode = "unlimited_access" | "cpd_certificate";

export type PaymentMethodId = "card" | "apple_pay" | "mada" | "tabby" | "tamara";

/* ---------- Items ---------- */

/** A saved or carted item as the catalog describes it now (title, artwork and price may have changed). */
export type ResolvedItem = {
  key: ShopItemKey;
  kind: ShopItemKind;
  id: number;
  title: string;
  image: string | null;
  href: string;
  /** Short label for the card: the category, "دبلوم", "باقة" or "استشارة". */
  tag: string | null;
  /** Lead instructor or consultant. */
  instructor: string | null;
  duration: string | null;
  courseCount: number | null;
  /** False when the item left the catalog: it can stay saved, but can't be bought. */
  available: boolean;
  /** An explicit zero price: enrolled from the item's page, never through the cart. */
  free: boolean;
  /** What the learner pays now (the offer price while an offer runs). Null when unknown or free. */
  priceAmount: number | null;
  /** Pre-offer price; set only while an offer undercuts it. */
  originalAmount: number | null;
  /** Priced, not free and not a consultation (those need a booked slot). */
  purchasable: boolean;
};

export type ResolveItemsRequest = { keys: ShopItemKey[] };

export type ResolveItemsResponse = {
  items: ResolvedItem[];
  /** Keys the catalog doesn't know at all. */
  missing: ShopItemKey[];
};

/* ---------- Quote ---------- */

export type QuoteLineRequest = { key: ShopItemKey; addons: AddonCode[] };

export type QuoteRequest = {
  lines: QuoteLineRequest[];
  coupon?: string | null;
};

export type QuoteAddon = {
  code: AddonCode;
  title: string;
  description: string;
  amount: number;
  selected: boolean;
};

export type QuoteLine = {
  key: ShopItemKey;
  item: ResolvedItem;
  /** Price of the item itself (the offer price while an offer runs). */
  unitAmount: number;
  originalAmount: number | null;
  /** Every add-on this item can take; `selected` marks the ones in the cart. */
  addons: QuoteAddon[];
  /** Sum of the selected add-ons. */
  addonsAmount: number;
  /** The coupon's share on this line. */
  discountAmount: number;
  /** `unitAmount + addonsAmount - discountAmount`. */
  totalAmount: number;
};

export type CouponStatus = "applied" | "invalid" | "expired" | "not_applicable" | "min_not_met";

export type QuoteCoupon = {
  code: string;
  status: CouponStatus;
  /** Ready-to-show explanation: what the coupon gives, or why it didn't apply. */
  message: string;
  /** `cart`: spread over every product line. `line`: only the lines in `appliedKeys`. */
  scope: "cart" | "line" | null;
  discountAmount: number;
  appliedKeys: ShopItemKey[];
};

export type QuoteTotals = {
  currency: string;
  /** Items at their current prices, plus selected add-ons. */
  subtotal: number;
  /** What running offers already took off the original prices (informational; not subtracted again). */
  offerSavings: number;
  /** Coupon discount. */
  discount: number;
  tax: number;
  total: number;
};

export type PaymentMethodOption = {
  id: PaymentMethodId;
  eligible: boolean;
  /** Why it can't be used for this order, ready to show. */
  reason: string | null;
  /** Pay-later plans: the order split into equal payments. */
  installments: { count: number; amount: number } | null;
};

export type Quote = {
  lines: QuoteLine[];
  /** Requested lines that can't be bought any more (left the catalog, became free, lost their price). */
  unavailable: { key: ShopItemKey; reason: "missing" | "inactive" | "free" | "unpriced" | "not_purchasable" }[];
  /** Null when no coupon was sent. */
  coupon: QuoteCoupon | null;
  totals: QuoteTotals;
  paymentMethods: PaymentMethodOption[];
};

/** Error body of the shop endpoints. */
export type ShopErrorCode =
  | "invalid_request"
  | "auth_required"
  | "checkout_unavailable"
  | "empty_cart"
  | "price_changed"
  | "payment_method_unavailable";

export type ShopErrorBody = {
  code: ShopErrorCode;
  message: string;
  /** Sent with `price_changed`: the quote as it stands now. */
  quote?: Quote;
};
