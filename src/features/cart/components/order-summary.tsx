"use client";

import { Info, Lock, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";

import { Money } from "@/components/shop/money";
import { Skeleton } from "@/components/ui/skeleton";
import { isMockCheckoutEnabled } from "@/config/env";
import { cn } from "@/lib/cn";
import { formatCount } from "@/lib/format";
import type { PaymentMethodId, Quote } from "@/lib/shop/contract";
import { PRODUCT_FORMS } from "@/lib/shop/labels";

import type { PaymentMethodDef } from "../model/payment-methods";
import { CouponForm } from "./coupon-form";
import { PaymentMethodPicker } from "./payment-method-picker";

type OrderSummaryProps = {
  /** Undefined until the first quote arrives. */
  quote: Quote | undefined;
  /** The totals on screen belong to an earlier cart; a fresh quote is on its way. */
  stale: boolean;
  /** The quote request failed and there is nothing to show. */
  failed: boolean;
  onRetry: () => void;
  couponCode: string | null;
  onApplyCoupon: (code: string | null) => void;
  offeredMethods: readonly PaymentMethodDef[];
  method: PaymentMethodId | null;
  onSelectMethod: (method: PaymentMethodId) => void;
  paying: boolean;
  payError: string | null;
  onPay: () => void;
};

/** Coupon, totals, payment method and the pay button. Sticky beside the cart on large screens. */
export function OrderSummary({
  quote,
  stale,
  failed,
  onRetry,
  couponCode,
  onApplyCoupon,
  offeredMethods,
  method,
  onSelectMethod,
  paying,
  payError,
  onPay,
}: OrderSummaryProps) {
  const mock = isMockCheckoutEnabled();
  const totals = quote?.totals;
  const free = totals?.total === 0;
  const canPay = mock && !!quote && quote.lines.length > 0 && !stale && !paying;

  return (
    <aside aria-labelledby="order-summary-title" className="flex flex-col gap-6 border border-line-strong bg-surface p-5 sm:p-6">
      <h2 id="order-summary-title" className="m-0 text-xl font-bold">
        ملخّص الطلب
      </h2>

      {/* While a change is re-priced the last verdict stays up; the form matches it to the code itself. */}
      <CouponForm code={couponCode} result={quote?.coupon} checking={stale} onApply={onApplyCoupon} />

      {totals && quote ? (
        <dl aria-busy={stale} className={cn("m-0 flex flex-col gap-3 text-[15px] transition-opacity", stale && "opacity-50")}>
          <SummaryRow term={`المجموع (${formatCount(quote.lines.length, PRODUCT_FORMS)})`}>
            <Money amount={totals.subtotal} />
          </SummaryRow>
          {totals.discount > 0 ? (
            <SummaryRow
              term={
                <>
                  خصم القسيمة{" "}
                  {quote.coupon ? (
                    <span dir="ltr" className="font-bold">
                      {quote.coupon.code}
                    </span>
                  ) : null}
                </>
              }
            >
              <span dir="ltr">−</span>
              <Money amount={totals.discount} />
            </SummaryRow>
          ) : null}
          {totals.tax > 0 ? (
            <SummaryRow term="الضريبة">
              <Money amount={totals.tax} />
            </SummaryRow>
          ) : null}
          <div className="flex items-baseline justify-between gap-4 border-t border-line-strong pt-4">
            <dt className="text-lg font-bold">الإجمالي</dt>
            <dd className="m-0 text-3xl font-bold">
              <Money amount={totals.total} />
            </dd>
          </div>
          {totals.offerSavings + totals.discount > 0 ? (
            <div className="flex items-baseline justify-between gap-4">
              <dt className="sr-only">ما وفّرته</dt>
              <dd className="ma-tag ma-tag--green m-0">
                وفّرت <Money amount={totals.offerSavings + totals.discount} /> في هذا الطلب
              </dd>
            </div>
          ) : null}
        </dl>
      ) : failed ? (
        <div className="ma-alert ma-alert--warning" role="alert">
          <TriangleAlert aria-hidden="true" className="fill-none" />
          <div>
            <p className="ma-alert__title">تعذّر حساب الإجمالي</p>
            <p className="ma-alert__text">
              سلتك محفوظة.{" "}
              <button type="button" onClick={onRetry} className="cursor-pointer border-0 bg-transparent p-0 font-[inherit] font-bold text-ink underline">
                أعد المحاولة
              </button>
            </p>
          </div>
        </div>
      ) : (
        <div role="status" className="flex flex-col gap-3">
          <span className="sr-only">جارٍ حساب الإجمالي…</span>
          <Skeleton className="h-5" />
          <Skeleton className="h-10" />
        </div>
      )}

      {quote && !free && quote.lines.length > 0 ? (
        <PaymentMethodPicker offered={offeredMethods} options={quote.paymentMethods} selected={method} onSelect={onSelectMethod} />
      ) : null}

      <div className="flex flex-col gap-3">
        {payError ? (
          <p role="alert" className="m-0 border-s-4 border-pink ps-3 text-sm leading-6 font-medium">
            {payError}
          </p>
        ) : null}

        <button
          type="button"
          onClick={onPay}
          disabled={!canPay}
          aria-busy={paying}
          className={cn("ma-btn ma-btn--primary ma-btn--lg ma-btn--block gap-2", paying && "is-loading")}
        >
          {free ? (
            "أكمل الطلب مجاناً"
          ) : (
            <>
              <Lock aria-hidden="true" className="size-5 fill-none" />
              أتمم الدفع
              {totals && !stale ? (
                <>
                  {" · "}
                  <Money amount={totals.total} />
                </>
              ) : null}
            </>
          )}
        </button>

        {mock ? (
          <p className="m-0 flex items-start gap-2 text-sm leading-6 text-fg-muted">
            <span className="ma-tag ma-tag--yellow shrink-0">وضع تجريبي</span>
            الدفع محاكاة فقط: لن يُخصم أي مبلغ.
          </p>
        ) : (
          <div className="ma-alert ma-alert--info" role="status">
            <Info aria-hidden="true" className="fill-none" />
            <div>
              <p className="ma-alert__title">الدفع الإلكتروني قريباً</p>
              <p className="ma-alert__text">نعمل على إتاحة الدفع من الموقع. سلتك محفوظة، وستجدها هنا عند الإطلاق.</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

function SummaryRow({ term, children }: { term: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-fg-muted">{term}</dt>
      <dd className="m-0 font-bold">{children}</dd>
    </div>
  );
}
