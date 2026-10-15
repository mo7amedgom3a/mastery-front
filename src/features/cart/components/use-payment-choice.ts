"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useState } from "react";

import type { CheckoutPayment } from "@/features/checkout/api/use-start-checkout";
import { commerceQueries } from "@/lib/api/commerce";
import { customerQueries } from "@/lib/api/customers";
import { useAuthStore } from "@/lib/auth/store";
import { trackPaymentMethod } from "@/lib/observability/behavior";
import type { PaymentMethodId } from "@/lib/shop/contract";

import { tamaraUnavailableReason, UAE_MOBILE_PATTERN, uaeMobileFrom, type TamaraState } from "./payment-method-picker";

/**
 * Card (Stripe) or Tamara, for an amount in the catalog currency (the cart total, or one product's
 * price). Tamara's eligibility, AED amount and widget key come from the backend for that amount, so
 * they follow every change. Its mobile number starts from the profile's, when that is a UAE number.
 */
export function usePaymentChoice(total: { amount: number; currency: string } | undefined) {
  const signedIn = useAuthStore((state) => state.status === "authenticated");
  const [chosen, setChosen] = useState<PaymentMethodId>("card");
  const [typedPhone, setTypedPhone] = useState<string | null>(null);

  const totalMinor = total ? Math.round(total.amount * 100) : 0;
  const options = useQuery({
    ...commerceQueries.tamaraOptions(totalMinor),
    enabled: totalMinor > 0,
    placeholderData: keepPreviousData,
  });
  const tamara: TamaraState = options.data
    ? { status: "ready", options: options.data }
    : options.isError
      ? { status: "error" }
      : { status: "loading" };
  const tamaraReady = tamara.status === "ready" && tamaraUnavailableReason(tamara) === null;

  const me = useQuery({ ...customerQueries.me(), enabled: signedIn });
  const phone = typedPhone ?? uaeMobileFrom(me.data?.phone);
  const phoneValid = UAE_MOBILE_PATTERN.test(phone);

  // Tamara stops being an option when the amount leaves its limits: fall back to card.
  const method: PaymentMethodId = chosen === "tamara" && !tamaraReady ? "card" : chosen;
  const payment: CheckoutPayment = method === "tamara" ? { provider: "tamara", phone } : { provider: "stripe" };

  return {
    method,
    setMethod: (next: PaymentMethodId) => {
      setChosen(next);
      trackPaymentMethod(next, total?.amount, total?.currency);
    },
    tamara,
    tamaraReady,
    /** The options with a widget key, when Tamara can take this amount; for `TamaraWidget`. */
    widgetOptions:
      tamaraReady && tamara.status === "ready" && tamara.options.public_key
        ? { ...tamara.options, public_key: tamara.options.public_key }
        : null,
    phone,
    setPhone: setTypedPhone,
    phoneError: phone.length >= 9 && !phoneValid ? "أدخل رقم جوال إماراتي من 9 أرقام يبدأ بـ 5." : null,
    /** The chosen method can't pay yet (Tamara without a valid mobile). */
    incomplete: method === "tamara" && !phoneValid,
    payment,
  };
}
