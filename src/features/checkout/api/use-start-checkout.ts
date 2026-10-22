"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { routes } from "@/config/routes";
import { ApiError } from "@/lib/api/client";
import {
  CHECKOUT_CURRENCY,
  createCheckoutSession,
  quoteCart,
  type CheckoutSessionRequest,
  type CheckoutSessionResponse,
} from "@/lib/api/commerce";
import { createSubscriptionCheckout, type SubscriptionCheckoutResponse } from "@/lib/api/subscriptions";
import { trackAuth, trackCheckout } from "@/lib/observability/behavior";
import { resolveCatalogProductId } from "@/lib/shop/catalog-ids";
import { syncAccountCart } from "@/lib/shop/cart-sync";
import { useShopStore, type ShopItem } from "@/lib/shop/store";
import { ensureAuthStatus } from "@/lib/shop/use-shop-actions";

import { checkoutKey, rotateCheckoutKey, savePendingCheckout } from "../model/checkout-session";
import { incentivesRequest, useCheckoutIncentives } from "../model/incentives-store";

/** Who takes the payment. Tamara needs the customer's UAE mobile (9 digits, starting with 5). */
export type CheckoutPayment = { provider: "stripe" } | { provider: "tamara"; phone: string };

export type CheckoutTarget =
  | { mode: "cart"; payment?: CheckoutPayment }
  | { mode: "product"; item: ShopItem; payment?: CheckoutPayment }
  /** A live diploma bought straight from its detail page: known product + cohort, no legacy item. */
  | { mode: "diploma"; productId: string; cohortId: string; payment?: CheckoutPayment }
  /** A subscription plan: recurring Stripe billing only; company plans carry their seats. */
  | {
      mode: "subscription";
      planId: string;
      seatCount?: number;
      companyName?: string;
      /** Company plans: who to contact about the subscription. */
      contact?: { name: string; email: string; phone?: string; job_title?: string };
      /** The team lead saved on the details step; checkout links its order to it. */
      leadId?: string | null;
      /** Where "back" on the Stripe page returns (defaults to this page). */
      cancelUrl?: string;
      payment?: undefined;
    };

const STRIPE: CheckoutPayment = { provider: "stripe" };

export type CheckoutPhase = "idle" | "preparing" | "redirecting";

/** How often a "still being prepared" answer is retried with the same key before giving up. */
const MAX_IN_PROGRESS_RETRIES = 3;

class CheckoutProblem extends Error {}

function errorCode(error: unknown): string | null {
  if (!(error instanceof ApiError)) return null;
  const detail = error.details.detail;
  return typeof detail === "object" && detail !== null && "code" in detail && typeof detail.code === "string"
    ? detail.code
    : null;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Opens the payment session (Stripe or Tamara) under a stable idempotency key. "Still being
 * prepared" (another request with this key is mid-flight) is retried with the same key; a key that
 * ended or was used for a different request is replaced once.
 */
async function openSession(
  create: (key: string) => Promise<CheckoutSessionResponse | SubscriptionCheckoutResponse>,
  fingerprint: string,
): Promise<CheckoutSessionResponse | SubscriptionCheckoutResponse> {
  let key = checkoutKey(fingerprint);
  let rotated = false;
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await create(key);
    } catch (error) {
      const code = errorCode(error);
      if (code === "checkout_in_progress" && attempt < MAX_IN_PROGRESS_RETRIES) {
        const seconds = Number((error as ApiError).details.retryAfter) || 1;
        await wait(Math.min(seconds, 5) * 1000 * (attempt + 1));
        continue;
      }
      if ((code === "idempotency_key_reused" || code === "idempotency_key_expired") && !rotated) {
        key = rotateCheckoutKey(fingerprint);
        rotated = true;
        continue;
      }
      throw error;
    }
  }
}

function paymentFields(payment: CheckoutPayment) {
  const origin = window.location.origin;
  // The backend appends order_id and payment_intent_id (and Stripe the session id).
  const urls = { success_url: `${origin}${routes.checkoutSuccess}`, cancel_url: `${origin}${routes.checkoutCancelled}` };
  if (payment.provider === "stripe") return { provider: "stripe" as const, ...urls };
  return {
    provider: "tamara" as const,
    phone_number: `+971${payment.phone}`,
    failure_url: `${origin}${routes.checkoutFailed}`,
    ...urls,
  };
}

async function prepareCart(payment: CheckoutPayment): Promise<{ body: CheckoutSessionRequest; fingerprint: string }> {
  // Lines added as a guest, or on another tab, reach the account cart before it is charged.
  await syncAccountCart();
  const quote = await quoteCart(undefined, incentivesRequest(useCheckoutIncentives.getState()));
  const lines = quote.lines ?? [];
  if (lines.length === 0) throw new CheckoutProblem("سلتك فارغة.");
  if (quote.unavailable_product_ids.length > 0) {
    throw new CheckoutProblem("بعض المنتجات في سلتك لم تعد متاحة للشراء. أزلها ثم أكمل الدفع.");
  }
  // Only what the quote accepted is sent: a rejected code stays on screen but never fails the payment.
  const couponCode = quote.coupon?.status === "applied" ? quote.coupon.code : null;
  const voucherIds = (quote.vouchers_applied ?? []).map((voucher) => voucher.voucher_id);
  // The provider is part of what is bought: switching to Tamara is a new order, not a reused key.
  // So are the coupon and vouchers: another discount is another order.
  const fingerprint = [
    "cart",
    payment.provider,
    lines.map((line) => `${line.product_id}x${line.quantity}`).toSorted().join(","),
    quote.total_amount_minor,
    quote.currency_code,
    couponCode ?? "",
    voucherIds.toSorted().join(","),
  ].join("|");
  return {
    body: {
      currency_code: quote.currency_code,
      quantity: 1,
      ...paymentFields(payment),
      ...(couponCode ? { coupon_code: couponCode } : {}),
      ...(voucherIds.length ? { voucher_ids: voucherIds } : {}),
    },
    fingerprint,
  };
}

async function prepareProduct(
  item: ShopItem,
  payment: CheckoutPayment,
): Promise<{ body: CheckoutSessionRequest; fingerprint: string }> {
  const productId = await resolveCatalogProductId(item);
  return {
    body: { product_id: productId, quantity: 1, currency_code: CHECKOUT_CURRENCY, ...paymentFields(payment) },
    // As for the cart: another provider is another order, under its own key.
    fingerprint: `product|${payment.provider}|${productId}|1`,
  };
}

async function prepareDiploma(
  productId: string,
  cohortId: string,
  payment: CheckoutPayment,
): Promise<{ body: CheckoutSessionRequest; fingerprint: string }> {
  return {
    body: {
      product_id: productId,
      cohort_id: cohortId,
      quantity: 1,
      currency_code: CHECKOUT_CURRENCY,
      ...paymentFields(payment),
    },
    fingerprint: `diploma|${payment.provider}|${productId}|${cohortId}`,
  };
}

function messageFor(error: unknown, provider: CheckoutPayment["provider"]): string {
  if (error instanceof CheckoutProblem) return error.message;
  if (error instanceof ApiError && provider === "tamara") {
    const code = errorCode(error);
    const incentive = code === "voucher_unavailable" || Boolean(code?.startsWith("coupon_"));
    if (error.status === 409 && code !== "checkout_in_progress" && !incentive) {
      return "أدخل رقم جوال إماراتي صالح للدفع عبر تمارا.";
    }
    if (error.status === 503) return "تمارا غير متاحة حالياً لهذا الطلب. جرّب الدفع بالبطاقة.";
  }
  if (error instanceof ApiError) {
    if (error.status === 404) return "هذا المنتج غير متاح للشراء حالياً.";
    if (error.status === 409) {
      const code = errorCode(error);
      if (code === "voucher_unavailable") return "تغيّر رصيد إحدى القسائم. راجع طلبك ثم حاول مجدداً.";
      if (code?.startsWith("coupon_")) return "لم تعد القسيمة صالحة لهذا الطلب. أزلها أو جرّب قسيمة أخرى.";
      if (errorCode(error) === "cohort_waitlisted") {
        return "اكتملت مقاعد هذه الدفعة. أضفناك إلى قائمة الانتظار وسنخبرك فور توفّر مقعد.";
      }
      return errorCode(error) === "checkout_in_progress"
        ? "ما زلنا نجهّز صفحة الدفع. حاول مجدداً بعد لحظات."
        : "تغيّرت سلتك أو لم تعد متاحة للدفع. حدّث الصفحة وحاول مجدداً.";
    }
    if (error.status === 422) {
      const detail = error.details.detail;
      return typeof detail === "string" && /Team size|Company name/.test(detail)
        ? "راجع حجم الفريق واسم الشركة ثم حاول مجدداً."
        : "تحقّق من البيانات المدخلة ثم حاول مجدداً.";
    }
    if (error.status === 429) return "محاولات كثيرة في وقت قصير. انتظر قليلاً ثم حاول مجدداً.";
    if (error.status >= 500) return "الدفع غير متاح حالياً. حاول مجدداً بعد قليل.";
  }
  return "تعذّر بدء الدفع. تحقّق من اتصالك وحاول مجدداً.";
}

/**
 * The pay / buy-now button. One checkout at a time: while one is being prepared, further presses
 * return the same promise (and the same idempotency key protects against a second tab or a retry).
 * Guests are asked to sign in first. On success the browser leaves for the provider, so the button
 * stays busy until the page unloads; coming back with the browser's back button resets it.
 */
export function useStartCheckout() {
  const inFlight = useRef<Promise<void> | null>(null);
  const [phase, setPhase] = useState<CheckoutPhase>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Back from the payment page: the page is restored from the back/forward cache with the button still busy.
    const onPageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      inFlight.current = null;
      setPhase("idle");
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  const run = useCallback(async (target: CheckoutTarget) => {
    setError(null);
    setPhase("preparing");
    let leaving = false;
    try {
      if (!(await ensureAuthStatus())) {
        if (target.mode === "cart") {
          useShopStore.getState().openAuthGate();
          trackAuth("auth_gate_opened");
        } else {
          leaving = true;
          window.location.assign(routes.loginThen(window.location.pathname));
        }
        return;
      }

      const payment = target.payment ?? STRIPE;
      let session: CheckoutSessionResponse | SubscriptionCheckoutResponse;
      let fingerprint: string;
      if (target.mode === "subscription") {
        const origin = window.location.origin;
        // Seats are part of what is bought: another seat count is another order, under its own key.
        fingerprint = `subscription|stripe|${target.planId}|${target.seatCount ?? 1}`;
        const body = {
          plan_id: target.planId,
          seat_count: target.seatCount ?? null,
          company_name: target.companyName?.trim() || null,
          contact: target.contact ?? null,
          lead_id: target.leadId ?? null,
          success_url: `${origin}${routes.checkoutSuccess}`,
          cancel_url: target.cancelUrl ? `${origin}${target.cancelUrl}` : window.location.href,
        };
        session = await openSession((key) => createSubscriptionCheckout(body, key), fingerprint);
      } else {
        const prepared =
          target.mode === "cart"
            ? await prepareCart(payment)
            : target.mode === "product"
              ? await prepareProduct(target.item, payment)
              : await prepareDiploma(target.productId, target.cohortId, payment);
        fingerprint = prepared.fingerprint;
        session = await openSession((key) => createCheckoutSession(prepared.body, key), fingerprint);
      }
      savePendingCheckout({ orderId: session.order_id, paymentIntentId: session.payment_intent_id, fingerprint });
      trackCheckout("order_created", {
        order_id: session.order_id,
        status: session.status,
        total: session.amount_minor / 100,
        currency: session.currency_code,
        mode: target.mode,
        provider: session.provider,
      });
      leaving = true;
      setPhase("redirecting");
      window.location.assign(session.checkout_url);
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) {
        useShopStore.getState().openAuthGate();
        trackAuth("auth_gate_opened");
      } else {
        setError(messageFor(cause, (target.payment ?? STRIPE).provider));
      }
    } finally {
      if (!leaving) {
        inFlight.current = null;
        setPhase("idle");
      }
    }
  }, []);

  const start = useCallback(
    (target: CheckoutTarget): Promise<void> => {
      inFlight.current ??= run(target);
      return inFlight.current;
    },
    [run],
  );

  return { start, phase, busy: phase !== "idle", error, clearError: useCallback(() => setError(null), []) };
}
