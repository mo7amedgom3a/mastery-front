"use client";

import { Ticket, Wallet, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { Money } from "@/components/shop/money";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";
import type { ResolvedReferral } from "@/lib/referral";
import { trackCoupon } from "@/lib/observability/behavior";
import type { QuoteCoupon, QuoteVoucher } from "@/lib/shop/contract";

type IncentivesPanelProps = {
  coupon: QuoteCoupon | null;
  suggestedCoupons?: { code: string; label: string; endsAt: string | null }[];
  /** The code the customer entered (shown while its quote is on its way). */
  couponCode: string | null;
  onApplyCoupon: (code: string) => void;
  onRemoveCoupon: () => void;
  vouchers: { applied: QuoteVoucher[]; available: QuoteVoucher[] } | undefined;
  selectedVoucherIds: string[];
  onVouchersChange: (ids: string[]) => void;
  currency: string;
  disabled: boolean;
  referral?: ResolvedReferral | null;
};

export function ReferralDiscountBadge({ referral }: { referral: ResolvedReferral }) {
  const percent = Number(referral.discount_percent);
  const formattedPercent = Number.isInteger(percent) ? `${percent}%` : `${percent.toFixed(1)}%`;

  return (
    <div className="flex w-full min-w-0 max-w-full flex-col gap-1.5 rounded-control border border-green/30 bg-green/10 p-3 text-xs sm:text-sm overflow-hidden">
      <div className="flex items-center justify-between gap-2 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="grid size-5 shrink-0 place-items-center rounded-full bg-green text-surface text-xs font-bold">
            ✓
          </span>
          <span className="font-bold text-fg truncate">خصم الإحالة مفعّل</span>
        </div>
        <span className="shrink-0 rounded-full bg-green/20 px-2 py-0.5 text-xs font-bold text-green">
          خصم {formattedPercent}
        </span>
      </div>
      {referral.partner_name ? (
        <div className="flex items-center gap-1.5 ps-7 min-w-0 text-xs text-fg-muted">
          <span className="shrink-0">بواسطة:</span>
          <bdi dir="ltr" className="font-mono truncate text-fg font-medium max-w-[200px] sm:max-w-[240px]">
            {referral.partner_name}
          </bdi>
        </div>
      ) : null}
    </div>
  );
}

/** Coupon code and voucher (store credit) selection, above the order totals. */
export function IncentivesPanel({
  coupon,
  suggestedCoupons = [],
  couponCode,
  onApplyCoupon,
  onRemoveCoupon,
  vouchers,
  selectedVoucherIds,
  onVouchersChange,
  currency,
  disabled,
  referral,
}: IncentivesPanelProps) {
  return (
    <div className="flex flex-col gap-5">
      {referral && referral.valid ? <ReferralDiscountBadge referral={referral} /> : null}
      {!couponCode && suggestedCoupons.length > 0 ? (
        <div className="flex flex-col gap-2 rounded-sm border border-green bg-surface-alt p-3">
          {suggestedCoupons.map((suggestion) => (
            <div key={suggestion.code} className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm">
                لديك قسيمة ترحيب بخصم <strong>{suggestion.label}</strong>
                {suggestion.endsAt ? ` حتى ${formatDate(suggestion.endsAt)}` : ""}
              </span>
              <button type="button" className="ma-btn ma-btn--soft ma-btn--sm" disabled={disabled} onClick={() => onApplyCoupon(suggestion.code)}>
                تطبيق
              </button>
            </div>
          ))}
        </div>
      ) : null}
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
    <fieldset className="m-0 flex w-full min-w-0 max-w-full flex-col gap-2 border-0 p-0" disabled={disabled}>
      <legend className="mb-2 flex items-center gap-2 p-0 text-sm font-bold">
        <Wallet aria-hidden="true" className="size-4 shrink-0 text-accent fill-none" />
        قسائم الرصيد
      </legend>
      {vouchers.available.map((voucher) => {
        const id = `${name}-${voucher.id}`;
        const isSelected = selected.includes(voucher.id);
        const amountUsed = used.get(voucher.id);
        return (
          <label
            key={voucher.id}
            htmlFor={id}
            className={cn(
              "flex w-full min-w-0 max-w-full cursor-pointer items-start gap-3 rounded-control border p-3 transition-colors",
              isSelected
                ? "border-accent bg-accent/5 shadow-xs"
                : "border-line bg-surface hover:border-line-strong"
            )}
          >
            <input
              id={id}
              type="checkbox"
              checked={isSelected}
              onChange={(event) => toggle(voucher.id, event.target.checked)}
              className="mt-1 size-4 shrink-0 cursor-pointer accent-[var(--accent)]"
            />
            <span className="flex min-w-0 flex-1 flex-col gap-1.5 overflow-hidden">
              <span className="flex min-w-0 flex-wrap items-center justify-between gap-2">
                <span className="inline-flex min-w-0 max-w-[65%] items-center gap-1 rounded bg-surface-alt px-1.5 py-0.5 border border-line text-xs font-mono font-bold tracking-wide">
                  <bdi dir="ltr" className="truncate">
                    {voucher.code}
                  </bdi>
                </span>
                <span className="shrink-0 text-xs font-semibold text-accent">
                  الرصيد: <Money amount={voucher.amount} />
                </span>
              </span>
              <span className="text-xs text-fg-muted">
                {amountUsed ? (
                  <span className="inline-flex items-center gap-1 text-green font-medium">
                    <span className="font-bold">✓</span> يُستخدم منها <Money amount={amountUsed} /> في هذا الطلب
                  </span>
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
