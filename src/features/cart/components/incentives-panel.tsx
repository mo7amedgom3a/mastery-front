"use client";

import { Ticket, Wallet, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { Money } from "@/components/shop/money";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";
import { trackCoupon } from "@/lib/observability/behavior";
import type { QuoteCoupon, QuoteVoucher } from "@/lib/shop/contract";

type IncentivesPanelProps = {
  coupon: QuoteCoupon | null;
  /** The code the customer entered (shown while its quote is on its way). */
  couponCode: string | null;
  onApplyCoupon: (code: string) => void;
  onRemoveCoupon: () => void;
  vouchers: { applied: QuoteVoucher[]; available: QuoteVoucher[] } | undefined;
  selectedVoucherIds: string[];
  onVouchersChange: (ids: string[]) => void;
  currency: string;
  disabled: boolean;
};

/** Coupon code and voucher (store credit) selection, above the order totals. */
export function IncentivesPanel({
  coupon,
  couponCode,
  onApplyCoupon,
  onRemoveCoupon,
  vouchers,
  selectedVoucherIds,
  onVouchersChange,
  currency,
  disabled,
}: IncentivesPanelProps) {
  return (
    <div className="flex flex-col gap-5">
      <CouponField
        coupon={coupon}
        couponCode={couponCode}
        onApply={onApplyCoupon}
        onRemove={onRemoveCoupon}
        currency={currency}
        disabled={disabled}
      />
      {vouchers && vouchers.available.length > 0 ? (
        <VoucherPicker
          vouchers={vouchers}
          selected={selectedVoucherIds}
          onChange={onVouchersChange}
          disabled={disabled}
        />
      ) : null}
    </div>
  );
}

function CouponField({
  coupon,
  couponCode,
  onApply,
  onRemove,
  currency,
  disabled,
}: {
  coupon: QuoteCoupon | null;
  couponCode: string | null;
  onApply: (code: string) => void;
  onRemove: () => void;
  currency: string;
  disabled: boolean;
}) {
  const inputId = useId();
  const [draft, setDraft] = useState("");
  const tracked = useRef<string | null>(null);

  useEffect(() => {
    if (!coupon) return;
    const key = `${coupon.code}:${coupon.status}`;
    if (tracked.current === key) return;
    tracked.current = key;
    trackCoupon(coupon, currency);
  }, [coupon, currency]);

  if (couponCode) {
    const applied = coupon?.status === "applied";
    return (
      <div className="flex flex-col gap-2">
        <div
          className={cn(
            "flex items-center justify-between gap-3 rounded-sm border px-3 py-2",
            applied ? "border-green bg-surface-alt" : "border-line-strong",
          )}
        >
          <span className="flex min-w-0 items-center gap-2">
            <Ticket aria-hidden="true" className="size-4 shrink-0 fill-none" />
            <bdi dir="ltr" className="truncate font-bold">
              {couponCode}
            </bdi>
            {applied && coupon.discountAmount > 0 ? (
              <span className="text-sm text-fg-muted">
                (−<Money amount={coupon.discountAmount} />)
              </span>
            ) : null}
          </span>
          <button
            type="button"
            onClick={() => {
              tracked.current = null;
              onRemove();
            }}
            disabled={disabled}
            aria-label={`إزالة القسيمة ${couponCode}`}
            className="grid size-7 cursor-pointer place-items-center rounded-full border-0 bg-transparent p-0 text-fg-muted hover:text-fg"
          >
            <X aria-hidden="true" className="size-4 fill-none" />
          </button>
        </div>
        {coupon ? (
          <p role="status" className={cn("m-0 text-sm leading-6", applied ? "text-fg-muted" : "font-medium text-pink")}>
            {coupon.message}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <form
      className="ma-field"
      onSubmit={(event) => {
        event.preventDefault();
        const code = draft.trim();
        if (code) {
          onApply(code);
          setDraft("");
        }
      }}
    >
      <label htmlFor={inputId} className="ma-label">
        لديك قسيمة خصم؟
      </label>
      <div className="flex items-stretch gap-2">
        <input
          id={inputId}
          dir="ltr"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={40}
          value={draft}
          onChange={(event) => setDraft(event.target.value.toUpperCase())}
          placeholder="SUMMER25"
          disabled={disabled}
          className="ma-input min-w-0 flex-1"
        />
        <button type="submit" disabled={disabled || !draft.trim()} className="ma-btn ma-btn--soft shrink-0">
          تطبيق
        </button>
      </div>
    </form>
  );
}

function VoucherPicker({
  vouchers,
  selected,
  onChange,
  disabled,
}: {
  vouchers: { applied: QuoteVoucher[]; available: QuoteVoucher[] };
  selected: string[];
  onChange: (ids: string[]) => void;
  disabled: boolean;
}) {
  const name = useId();
  const used = new Map(vouchers.applied.map((voucher) => [voucher.id, voucher.amount]));
  const toggle = (id: string, checked: boolean) =>
    onChange(checked ? [...selected.filter((v) => v !== id), id] : selected.filter((v) => v !== id));

  return (
    <fieldset className="m-0 flex min-w-0 flex-col gap-2 border-0 p-0" disabled={disabled}>
      <legend className="mb-2 flex items-center gap-2 p-0 text-base font-bold">
        <Wallet aria-hidden="true" className="size-4 fill-none" />
        قسائم الرصيد
      </legend>
      {vouchers.available.map((voucher) => {
        const id = `${name}-${voucher.id}`;
        const amountUsed = used.get(voucher.id);
        return (
          <label
            key={voucher.id}
            htmlFor={id}
            className="flex cursor-pointer items-start gap-3 rounded-sm border border-line px-3 py-2"
          >
            <input
              id={id}
              type="checkbox"
              checked={selected.includes(voucher.id)}
              onChange={(event) => toggle(voucher.id, event.target.checked)}
              className="mt-1.5 size-4 shrink-0 cursor-pointer accent-[var(--accent)]"
            />
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="flex flex-wrap items-baseline justify-between gap-x-3">
                <bdi dir="ltr" className="font-bold">
                  {voucher.code}
                </bdi>
                <span className="text-sm">
                  الرصيد <Money amount={voucher.amount} />
                </span>
              </span>
              <span className="text-sm text-fg-muted">
                {amountUsed ? (
                  <>
                    يُستخدم منها <Money amount={amountUsed} /> في هذا الطلب
                  </>
                ) : voucher.expiresAt ? (
                  `صالحة حتى ${formatDate(voucher.expiresAt)}`
                ) : (
                  "بلا تاريخ انتهاء"
                )}
              </span>
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}
