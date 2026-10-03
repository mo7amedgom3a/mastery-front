"use client";

import { useQueryClient } from "@tanstack/react-query";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { routes } from "@/config/routes";
import { createOrder, ShopApiError, shopKeys } from "@/features/cart/api/shop-client";
import { trackAuth, trackCheckout } from "@/lib/observability/behavior";
import type { PaymentMethodId, Quote, QuoteRequest } from "@/lib/shop/contract";
import { useShopStore } from "@/lib/shop/store";
import { ensureAuthStatus } from "@/lib/shop/use-shop-actions";

type CheckoutInput = {
  /** The quote on screen; its total is what the customer agreed to. */
  quote: Quote | undefined;
  /** The cart that quote was made for. */
  request: QuoteRequest;
  method: PaymentMethodId | null;
};

/**
 * The pay button: checks for a session (guests get the sign-in dialog), places the order for the
 * quoted total, then hands over to the payment page — or straight to the confirmation when there
 * is nothing to pay. A price that moved since the quote comes back as an error with the new quote,
 * which replaces the one on screen so the customer sees the new total before trying again.
 */
export function useCheckout({ quote, request, method }: CheckoutInput) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pay = async (options: { asMockCustomer?: boolean } = {}) => {
    if (!quote || busy) return;
    const shop = useShopStore.getState();
    const free = quote.totals.total === 0;
    if (!free && !method) {
      setError("اختر طريقة الدفع أولاً.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const signedIn = await ensureAuthStatus();
      const mockCustomer = !signedIn && (options.asMockCustomer || shop.mockCustomer);
      if (!signedIn && !mockCustomer) {
        shop.openAuthGate();
        trackAuth("auth_gate_opened");
        return;
      }

      const { order, payment } = await createOrder({
        ...request,
        paymentMethod: free ? null : method,
        expectedTotal: quote.totals.total,
        mockCustomer: mockCustomer || undefined,
      });
      shop.setOrder(order);
      trackCheckout("order_created", {
        order_number: order.number,
        status: order.status,
        total: order.totals.total,
        lines: order.lines.length,
        payment_method: order.paymentMethod ?? "none",
      });
      if (payment.action === "redirect") {
        router.push(payment.url as Route);
      } else {
        shop.clearCart();
        router.push(routes.checkoutSuccess);
      }
    } catch (cause) {
      if (cause instanceof ShopApiError) {
        if (cause.code === "price_changed" && cause.quote) {
          queryClient.setQueryData(shopKeys.quote(request), cause.quote);
        }
        if (cause.code === "auth_required") {
          shop.openAuthGate();
          trackAuth("auth_gate_opened");
        }
        setError(cause.message);
      } else {
        setError("تعذّر إتمام الطلب. تحقّق من اتصالك وحاول مجدداً.");
      }
    } finally {
      setBusy(false);
    }
  };

  return { pay, busy, error, clearError: () => setError(null) };
}
