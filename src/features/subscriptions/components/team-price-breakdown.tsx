import { formatMoney } from "@/lib/format";

import type { PlanVM } from "../model/plans";
import type { SeatQuote } from "../model/quote";

const PER: Record<PlanVM["interval"], string> = { month: "شهرياً", year: "سنوياً" };

/**
 * What the team pays each billing period: price per employee × employees, VAT on that, and the total.
 * The numbers are the ones checkout charges, so nothing changes on the Stripe page.
 */
export function TeamPriceBreakdown({ plan, quote }: { plan: PlanVM; quote: SeatQuote }) {
  const money = (minor: number) => formatMoney(minor / 100);
  const perMonth = plan.interval === "year" ? money(Math.round(quote.totalMinor / 12)) : null;
  return (
    <dl className="m-0 flex flex-col gap-3" aria-live="polite">
      <div className="flex items-baseline justify-between gap-4">
        <dt className="text-fg-muted">
          <span dir="ltr">{money(quote.unitMinor)}</span> × {quote.seats} موظفاً
        </dt>
        <dd className="m-0 font-bold tabular-nums" dir="ltr">
          {money(quote.subtotalMinor)}
        </dd>
      </div>
      <div className="flex items-baseline justify-between gap-4">
        <dt className="text-fg-muted">{quote.taxPercent > 0 ? `ضريبة القيمة المضافة (${quote.taxPercent}٪)` : "الضريبة"}</dt>
        <dd className="m-0 font-bold tabular-nums" dir="ltr">
          {quote.taxPercent > 0 ? money(quote.taxMinor) : "—"}
        </dd>
      </div>
      <div className="flex items-baseline justify-between gap-4 border-t border-line-strong pt-3">
        <dt className="text-lg font-bold">الإجمالي {PER[plan.interval]}</dt>
        <dd className="m-0 text-2xl font-bold tabular-nums" dir="ltr">
          {money(quote.totalMinor)}
        </dd>
      </div>
      {perMonth ? (
        <p className="m-0 text-end text-sm text-fg-muted">
          أي <span dir="ltr">{perMonth}</span> شهرياً لكل الفريق، تُدفع مرة واحدة في السنة
        </p>
      ) : null}
    </dl>
  );
}
