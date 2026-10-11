"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";

import { routes } from "@/config/routes";
import { ApiError } from "@/lib/api/client";
import { enrollFree, type FreeEnrollmentResponse } from "@/lib/api/commerce";
import { trackAuth, trackCheckout } from "@/lib/observability/behavior";
import { resolveCatalogProductId } from "@/lib/shop/catalog-ids";
import type { ShopItem } from "@/lib/shop/store";
import { useShopStore } from "@/lib/shop/store";
import { ensureAuthStatus } from "@/lib/shop/use-shop-actions";
import { refreshOwnedProducts } from "@/lib/shop/use-owned-products";

import { checkoutKey, rotateCheckoutKey, savePendingCheckout } from "../model/checkout-session";
import type { CheckoutPhase } from "./use-start-checkout";

function errorCode(error: unknown): string | null {
  if (!(error instanceof ApiError)) return null;
  const detail = error.details.detail;
  return typeof detail === "object" && detail !== null && "code" in detail && typeof detail.code === "string"
    ? detail.code
    : null;
}

/** Enrolls under a stable idempotency key; a key already used for something else is replaced once. */
async function enroll(productId: string, fingerprint: string): Promise<FreeEnrollmentResponse> {
  try {
    return await enrollFree(productId, checkoutKey(fingerprint));
  } catch (error) {
    if (errorCode(error) !== "idempotency_key_reused") throw error;
    return enrollFree(productId, rotateCheckoutKey(fingerprint));
  }
}

function messageFor(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 404) return "هذا المحتوى غير متاح للتسجيل حالياً.";
    if (error.status === 409) {
      return errorCode(error) === "product_not_free"
        ? "لم يعد هذا المحتوى مجانياً. حدّث الصفحة لرؤية السعر الحالي."
        : "ما زلنا نجهّز تسجيلك. حاول مجدداً بعد لحظات.";
    }
    if (error.status === 429) return "محاولات كثيرة في وقت قصير. انتظر قليلاً ثم حاول مجدداً.";
    if (error.status >= 500) return "التسجيل غير متاح حالياً. حاول مجدداً بعد قليل.";
  }
  return "تعذّر إتمام التسجيل. تحقّق من اتصالك وحاول مجدداً.";
}

/**
 * The "start learning for free" action. The backend checks the price is really 0, then creates a
 * paid 0.00 order, its invoice and the access in one step, so there is nothing to pay: the visitor
 * lands on the order confirmation. Guests sign in first and come back to this page; someone who
 * already has access goes straight to their content.
 */
export function useEnrollFree() {
  const router = useRouter();
  const inFlight = useRef<Promise<void> | null>(null);
  const [phase, setPhase] = useState<CheckoutPhase>("idle");
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (item: ShopItem) => {
    setError(null);
    setPhase("preparing");
    let leaving = false;
    try {
      if (!(await ensureAuthStatus())) {
        leaving = true;
        window.location.assign(routes.loginThen(window.location.pathname));
        return;
      }

      const productId = await resolveCatalogProductId(item);
      const fingerprint = `free|${productId}`;
      const enrollment = await enroll(productId, fingerprint);
      void refreshOwnedProducts();
      leaving = true;
      setPhase("redirecting");
      if (enrollment.already_owned || !enrollment.order_id || !enrollment.payment_intent_id) {
        router.push(routes.studentAccess);
        return;
      }
      savePendingCheckout({
        orderId: enrollment.order_id,
        paymentIntentId: enrollment.payment_intent_id,
        fingerprint,
      });
      trackCheckout("order_created", {
        order_id: enrollment.order_id,
        status: enrollment.status,
        total: 0,
        currency: enrollment.currency_code,
        mode: "free",
      });
      const query = new URLSearchParams({
        order_id: enrollment.order_id,
        payment_intent_id: enrollment.payment_intent_id,
      });
      router.push(`${routes.checkoutSuccess}?${query}` as Route);
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
  }, [router]);

  const start = useCallback(
    (item: ShopItem): Promise<void> => {
      inFlight.current ??= run(item);
      return inFlight.current;
    },
    [run],
  );

  return { start, phase, busy: phase !== "idle", error };
}
