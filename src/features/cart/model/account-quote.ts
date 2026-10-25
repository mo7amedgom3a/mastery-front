import type { CheckoutQuoteResponse, QuotedVoucherResponse } from "@/lib/api/commerce";
import { fromMinor } from "@/lib/format";
import { shopItemHref, shopKeyFromSlug } from "@/lib/shop/product-links";
import {
  parseShopKey,
  type CouponStatus,
  type Quote,
  type QuoteCoupon,
  type QuoteLine,
  type QuoteVoucher,
  type ResolvedItem,
} from "@/lib/shop/contract";

const COUPON_MESSAGES: Record<Exclude<CouponStatus, "applied">, string> = {
  invalid: "رمز القسيمة غير صحيح. تحقّق من كتابته وحاول مجدداً.",
  expired: "انتهت صلاحية هذه القسيمة.",
  not_started: "هذه القسيمة لم تبدأ بعد.",
  inactive: "هذه القسيمة غير متاحة حالياً.",
  not_applicable: "هذه القسيمة لا تنطبق على المنتجات الموجودة في سلتك.",
  min_not_met: "قيمة سلتك أقل من الحد الأدنى لهذه القسيمة.",
  limit_reached: "استُخدمت هذه القسيمة بالحد الأقصى المسموح.",
  not_eligible: "هذه القسيمة لأول عملية شراء فقط.",
};

/** The backend's coupon outcome, with a ready-to-show message. */
export function quoteCoupon(
  coupon: { code: string; status: string; discount_amount_minor: number } | null | undefined,
  appliedKeys: string[] = [],
): QuoteCoupon | null {
  if (!coupon) return null;
  const status = (coupon.status in COUPON_MESSAGES || coupon.status === "applied" ? coupon.status : "invalid") as CouponStatus;
  return {
    code: coupon.code,
    status,
    message: status === "applied" ? "تم تطبيق القسيمة." : COUPON_MESSAGES[status],
    scope: status === "applied" ? (appliedKeys.length ? "line" : "cart") : null,
    discountAmount: fromMinor(coupon.discount_amount_minor),
    appliedKeys,
  };
}

export function quoteVoucher(voucher: QuotedVoucherResponse): QuoteVoucher {
  return {
    id: voucher.voucher_id,
    code: voucher.code,
    amount: fromMinor(voucher.amount_minor),
    expiresAt: voucher.expires_at ?? null,
    source: voucher.source ?? undefined,
  };
}

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
        discountAmount: fromMinor(line.discount_amount_minor ?? 0),
        totalAmount: fromMinor(line.total_amount_minor - (line.discount_amount_minor ?? 0)),
      },
    ];
  });

  return {
    lines,
    unavailable: quote.unavailable_product_ids.flatMap((productId) => {
      const key = keysByProduct.get(productId);
      return key ? [{ key, reason: "unpriced" as const }] : [];
    }),
    coupon: quoteCoupon(quote.coupon),
    vouchers: {
      applied: (quote.vouchers_applied ?? []).map(quoteVoucher),
      available: (quote.available_vouchers ?? []).map(quoteVoucher),
    },
    suggestedCoupons: (quote.suggested_coupons ?? []).map((coupon) => ({
      code: coupon.code,
      label: coupon.kind === "percent" ? `${Number(coupon.value)}%` : `$${Number(coupon.value)}`,
      endsAt: coupon.ends_at ?? null,
    })),
    totals: {
      currency: quote.currency_code,
      subtotal: fromMinor(quote.subtotal_amount_minor),
      // Informational, like the guest preview: what running offers take off the catalog prices.
      offerSavings: lines.reduce(
        (sum, line) => sum + (line.originalAmount === null ? 0 : line.originalAmount - line.unitAmount),
        0,
      ),
      discount: fromMinor(quote.discount_amount_minor),
      voucher: fromMinor(quote.voucher_amount_minor ?? 0),
      tax: fromMinor(quote.tax_amount_minor),
      total: fromMinor(quote.total_amount_minor),
    },
    paymentMethods: [],
  };
}
