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
import { trackAuth, trackCheckout } from "@/lib/observability/behavior";
import { resolveCatalogProductId } from "@/lib/shop/catalog-ids";
import { syncAccountCart } from "@/lib/shop/cart-sync";
import { useShopStore, type ShopItem } from "@/lib/shop/store";
import { ensureAuthStatus } from "@/lib/shop/use-shop-actions";

import { checkoutKey, rotateCheckoutKey, savePendingCheckout } from "../model/checkout-session";

export type CheckoutTarget = { mode: "cart" } | { mode: "product"; item: ShopItem };

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
 * Opens the Stripe session under a stable idempotency key. "Still being prepared" (another request
 * with this key is mid-flight) is retried with the same key; a key that ended or was used for a
 * different request is replaced once.
 */
async function openSession(body: CheckoutSessionRequest, fingerprint: string): Promise<CheckoutSessionResponse> {
  let key = checkoutKey(fingerprint);
  let rotated = false;
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await createCheckoutSession(body, key);
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

function returnUrls() {
  const origin = window.location.origin;
  // The backend appends order_id and payment_intent_id (and Stripe the session id).
  return { success_url: `${origin}${routes.checkoutSuccess}`, cancel_url: `${origin}${routes.checkoutCancelled}` };
}

async function prepareCart(): Promise<{ body: CheckoutSessionRequest; fingerprint: string }> {
  // Lines added as a guest, or on another tab, reach the account cart before it is charged.
  await syncAccountCart();
  const quote = await quoteCart();
  const lines = quote.lines ?? [];
  if (lines.length === 0) throw new CheckoutProblem("سلتك فارغة.");
  if (quote.unavailable_product_ids.length > 0) {
    throw new CheckoutProblem("بعض المنتجات في سلتك لم تعد متاحة للشراء. أزلها ثم أكمل الدفع.");
  }
  const fingerprint = [
    "cart",
    lines.map((line) => `${line.product_id}x${line.quantity}`).toSorted().join(","),
    quote.total_amount_minor,
    quote.currency_code,
  ].join("|");
  return { body: { currency_code: quote.currency_code, quantity: 1, ...returnUrls() }, fingerprint };
}

async function prepareProduct(item: ShopItem): Promise<{ body: CheckoutSessionRequest; fingerprint: string }> {
  const productId = await resolveCatalogProductId(item);
  return {
    body: { product_id: productId, quantity: 1, currency_code: CHECKOUT_CURRENCY, ...returnUrls() },
    fingerprint: `product|${productId}|1`,
  };
}

function messageFor(error: unknown): string {
  if (error instanceof CheckoutProblem) return error.message;
  if (error instanceof ApiError) {
    if (error.status === 404) return "هذا المنتج غير متاح للشراء حالياً.";
    if (error.status === 409) {
      return errorCode(error) === "checkout_in_progress"
        ? "ما زلنا نجهّز صفحة الدفع. حاول مجدداً بعد لحظات."
        : "تغيّرت سلتك أو لم تعد متاحة للدفع. حدّث الصفحة وحاول مجدداً.";
    }
    if (error.status === 429) return "محاولات كثيرة في وقت قصير. انتظر قليلاً ثم حاول مجدداً.";
    if (error.status >= 500) return "الدفع غير متاح حالياً. حاول مجدداً بعد قليل.";
  }
  return "تعذّر بدء الدفع. تحقّق من اتصالك وحاول مجدداً.";
}

/**
 * The pay / buy-now button. One checkout at a time: while one is being prepared, further presses
 * return the same promise (and the same idempotency key protects against a second tab or a retry).
 * Guests are asked to sign in first. On success the browser leaves for Stripe, so the button stays
 * busy until the page unloads; coming back with the browser's back button resets it.
 */
export function useStartCheckout() {
  const inFlight = useRef<Promise<void> | null>(null);
  const [phase, setPhase] = useState<CheckoutPhase>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Back from Stripe: the page is restored from the back/forward cache with the button still busy.
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

      const { body, fingerprint } = target.mode === "cart" ? await prepareCart() : await prepareProduct(target.item);
      const session = await openSession(body, fingerprint);
      savePendingCheckout({ orderId: session.order_id, paymentIntentId: session.payment_intent_id, fingerprint });
      trackCheckout("order_created", {
        order_id: session.order_id,
        status: session.status,
        total: session.amount_minor / 100,
        currency: session.currency_code,
        mode: target.mode,
      });
      leaving = true;
      setPhase("redirecting");
      window.location.assign(session.checkout_url);
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) {
        useShopStore.getState().openAuthGate();
        trackAuth("auth_gate_opened");
      } else {
        setError(messageFor(cause));
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
