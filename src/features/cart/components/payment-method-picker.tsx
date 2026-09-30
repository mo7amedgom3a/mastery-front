"use client";

import { useId, useState } from "react";

import { Money } from "@/components/shop/money";
import { isMockCheckoutEnabled } from "@/config/env";
import { cn } from "@/lib/cn";
import type { PaymentMethodId, PaymentMethodOption } from "@/lib/shop/contract";

import { PAYMENT_METHODS, type PaymentMethodDef } from "../model/payment-methods";

/** Whether this browser can pay with Apple Pay at all (Safari on Apple devices). */
function canUseApplePay(): boolean {
  return typeof window !== "undefined" && "ApplePaySession" in window;
}

/**
 * The methods to offer on this device. Apple Pay is left out where it can't work — except in mock
 * checkout, where it stays listed so the flow can be tried from any browser.
 */
export function useOfferedMethods(): readonly PaymentMethodDef[] {
  // Rendered in the browser only (the cart shows a skeleton until its storage is read).
  const [applePay] = useState(() => canUseApplePay() || isMockCheckoutEnabled());
  return applePay ? PAYMENT_METHODS : PAYMENT_METHODS.filter((method) => method.requires !== "apple_pay");
}

/** The stored choice when it can pay for this order, else the first method that can. */
export function effectiveMethod(
  chosen: PaymentMethodId | null,
  offered: readonly PaymentMethodDef[],
  options: readonly PaymentMethodOption[],
): PaymentMethodId | null {
  const usable = offered.filter((method) => options.find((option) => option.id === method.id)?.eligible);
  return usable.find((method) => method.id === chosen)?.id ?? usable[0]?.id ?? null;
}

type PaymentMethodPickerProps = {
  offered: readonly PaymentMethodDef[];
  options: readonly PaymentMethodOption[];
  selected: PaymentMethodId | null;
  onSelect: (method: PaymentMethodId) => void;
};

/** Radio list of payment methods; a method the order doesn't qualify for stays visible, with the reason. */
export function PaymentMethodPicker({ offered, options, selected, onSelect }: PaymentMethodPickerProps) {
  const name = useId();
  return (
    <fieldset className="m-0 min-w-0 border-0 p-0">
      <legend className="mb-3 p-0 text-sm font-bold">طريقة الدفع</legend>
      <div className="flex flex-col gap-2">
        {offered.map((method) => {
          const option = options.find((entry) => entry.id === method.id);
          const eligible = option?.eligible ?? false;
          const checked = selected === method.id;
          return (
            <label
              key={method.id}
              className={cn(
                "flex items-start gap-3 border p-3",
                checked ? "border-line-strong bg-surface-alt" : "border-line",
                eligible ? "cursor-pointer hover:border-line-strong" : "cursor-not-allowed opacity-60",
              )}
            >
              <input
                type="radio"
                name={name}
                value={method.id}
                checked={checked}
                disabled={!eligible}
                onChange={() => onSelect(method.id)}
                className="mt-1 size-5 shrink-0 accent-[var(--accent)]"
              />
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                  <span className="font-bold">{method.label}</span>
                  <span className="flex flex-wrap gap-1.5" aria-hidden="true">
                    {method.marks.map((mark) => (
                      <PaymentMark key={mark} name={mark} />
                    ))}
                  </span>
                </span>
                <span className="text-sm leading-6 text-fg-muted">
                  {option?.installments ? (
                    <>
                      {option.installments.count} دفعات بلا فوائد، كل دفعة <Money amount={option.installments.amount} className="font-bold text-fg" />.
                    </>
                  ) : (
                    (option?.reason ?? method.description)
                  )}
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

/**
 * Text stand-in for a payment brand's logo.
 * TODO(assets): replace with the official logo files (each brand publishes usage guidelines).
 */
export function PaymentMark({ name }: { name: string }) {
  return (
    <span dir="ltr" className="inline-flex min-h-6 items-center border border-line px-1.5 text-[11px] leading-none font-bold tracking-wide">
      {name}
    </span>
  );
}
