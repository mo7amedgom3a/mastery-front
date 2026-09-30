"use client";

import { TicketPercent, X } from "lucide-react";
import { useId, useState, type FormEvent } from "react";

import { cn } from "@/lib/cn";
import type { QuoteCoupon } from "@/lib/shop/contract";

type CouponFormProps = {
  /** The code the cart currently carries, whether or not it was accepted. */
  code: string | null;
  /** The quote's verdict on `code`; undefined until the quote that includes it arrives. */
  result: QuoteCoupon | null | undefined;
  /** A quote is on its way. */
  checking: boolean;
  onApply: (code: string | null) => void;
};

/**
 * One coupon per order. What it discounts — a single product or the whole cart — is the coupon's
 * own rule, decided by the quote; this only sends the code and shows the verdict.
 */
export function CouponForm({ code, result, checking, onApply }: CouponFormProps) {
  const inputId = useId();
  const helpId = useId();
  const [text, setText] = useState(code ?? "");

  // The verdict belongs to the code it was given for; an older quote says nothing about a new code.
  const verdict = code && result && result.code.toUpperCase() === code.trim().toUpperCase() ? result : null;
  const applied = verdict?.status === "applied";
  const rejected = verdict !== null && !applied;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    onApply(text.trim() || null);
  };

  if (applied && verdict) {
    return (
      <div className="flex items-start justify-between gap-3 border border-line-strong p-3">
        <div className="flex min-w-0 items-start gap-3">
          <TicketPercent aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-accent" />
          <p role="status" className="m-0 min-w-0 text-sm leading-6">
            <strong dir="ltr" className="block font-bold tracking-wide">
              {verdict.code}
            </strong>
            {verdict.message}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setText("");
            onApply(null);
          }}
          aria-label={`إزالة القسيمة ${verdict.code}`}
          className="ma-btn ma-btn--ghost ma-btn--icon ma-btn--sm size-11 shrink-0"
        >
          <X aria-hidden="true" className="size-4 fill-none" />
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className={cn("ma-field", rejected && "is-error")} noValidate>
      <label htmlFor={inputId} className="ma-label">
        قسيمة الخصم
      </label>
      <div className="flex gap-2">
        <input
          id={inputId}
          name="coupon"
          type="text"
          dir="ltr"
          value={text}
          onChange={(event) => setText(event.target.value)}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={40}
          placeholder="MASTERY10"
          aria-invalid={rejected || undefined}
          aria-describedby={rejected ? helpId : undefined}
          className="ma-input min-w-0 flex-1 text-start uppercase placeholder:normal-case"
        />
        <button
          type="submit"
          disabled={checking || text.trim() === ""}
          className={cn("ma-btn ma-btn--outline shrink-0", checking && code !== null && "is-loading")}
        >
          تطبيق
        </button>
      </div>
      {rejected && verdict ? (
        <p id={helpId} role="alert" className="ma-help m-0">
          {verdict.message}
        </p>
      ) : null}
    </form>
  );
}
