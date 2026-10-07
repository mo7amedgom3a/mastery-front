"use client";

import { Lock, ShieldCheck, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";

import { Money } from "@/components/shop/money";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/cn";
import { formatCount } from "@/lib/format";
import type { Quote } from "@/lib/shop/contract";
import { PRODUCT_FORMS } from "@/lib/shop/labels";

type OrderSummaryProps = {
  /** Undefined until the first quote arrives. */
  quote: Quote | undefined;
  /** The totals on screen belong to an earlier cart; a fresh quote is on its way. */
  stale: boolean;
  /** The quote request failed and there is nothing to show. */
  failed: boolean;
  onRetry: () => void;
  /** Something in the cart can't be bought; the button stays off until it is removed. */
  blocked: boolean;
  paying: boolean;
  payError: string | null;
  onPay: () => void;
};

/** Totals and the pay button. Sticky beside the cart on large screens. */
export function OrderSummary({ quote, stale, failed, onRetry, blocked, paying, payError, onPay }: OrderSummaryProps) {
  const totals = quote?.totals;
  const canPay = !!quote && quote.lines.length > 0 && !stale && !blocked && !paying;

  return (
    <aside aria-labelledby="order-summary-title" className="flex flex-col gap-6 rounded-panel border border-line-strong bg-surface p-5 sm:p-6">
      <h2 id="order-summary-title" className="m-0 text-xl font-bold">
        ملخّص الطلب
      </h2>

      {totals && quote ? (
        <dl aria-busy={stale} className={cn("m-0 flex flex-col gap-3 text-[15px] transition-opacity", stale && "opacity-50")}>
          <SummaryRow term={`المجموع (${formatCount(quote.lines.length, PRODUCT_FORMS)})`}>
            <Money amount={totals.subtotal} />
          </SummaryRow>
          {totals.discount > 0 ? (
            <SummaryRow term="الخصم">
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
          {totals.offerSavings > 0 ? (
            <div className="flex items-baseline justify-between gap-4">
              <dt className="sr-only">ما وفّرته</dt>
              <dd className="ma-tag ma-tag--green m-0">
                وفّرت <Money amount={totals.offerSavings} /> في هذا الطلب
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
          <Lock aria-hidden="true" className="size-5 fill-none" />
          {paying ? "جارٍ تجهيز الدفع…" : "أتمم الدفع"}
          {totals && !stale && !paying ? (
            <>
              {" · "}
              <Money amount={totals.total} />
            </>
          ) : null}
        </button>

        <p className="m-0 flex items-start gap-2 text-sm leading-6 text-fg-muted">
          <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 fill-none" />
          تتم عملية الدفع في صفحة Stripe الآمنة. لا نحفظ بيانات بطاقتك.
        </p>
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
