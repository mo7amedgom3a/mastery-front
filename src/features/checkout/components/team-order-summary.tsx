import { ArrowLeft, Users } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { buttonClass, ButtonLink } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";
import { orderNumber } from "@/features/orders/model/status";
import type { OrderDetailResponse } from "@/lib/api/commerce";
import { formatDate, formatMoney } from "@/lib/format";

export type TeamOrder = {
  companyName: string | null;
  seats: number;
  unitMinor: number;
  subtotalMinor: number;
  taxMinor: number;
  taxPercent: number;
  totalMinor: number;
  interval: "month" | "year";
};

/** A company (per-employee) subscription order, from what checkout stored on its line; null for anything else. */
export function teamOrderOf(order: OrderDetailResponse | undefined): TeamOrder | null {
  const line = order?.lines?.find((item) => item.product_type === "subscription");
  const subscription = line?.product_snapshot?.subscription as Record<string, unknown> | undefined;
  if (!order || !line || !subscription || typeof subscription.seat_count !== "number") return null;
  const quote = (subscription.quote ?? {}) as Record<string, unknown>;
  const subtotalMinor = order.subtotal_minor ?? line.total_amount_minor;
  return {
    companyName: typeof subscription.company_name === "string" ? subscription.company_name : null,
    seats: line.quantity,
    unitMinor: line.unit_amount_minor,
    subtotalMinor,
    taxMinor: order.tax_minor ?? 0,
    taxPercent: Number(quote.tax_percent ?? 0) || 0,
    totalMinor: order.amount_minor,
    interval: subscription.billing_interval === "year" ? "year" : "month",
  };
}

/** Where a company adds its employees: the eMastery Business dashboard, or the seat page until it is configured. */
export function AddEmployeesLink() {
  const label = (
    <>
      ابدأ بإضافة موظفيك
      <ArrowLeft aria-hidden="true" className="size-5 fill-none" />
    </>
  );
  return siteConfig.b2bDashboardUrl ? (
    <a href={siteConfig.b2bDashboardUrl} className={`${buttonClass({ variant: "primary" })} gap-2`}>
      {label}
    </a>
  ) : (
    <ButtonLink href={routes.studentSubscription} variant="primary" className="gap-2">
      {label}
    </ButtonLink>
  );
}

/** The thank-you page's billing card for a team: who, how many employees, and what each period costs. */
export function TeamOrderSummary({
  team,
  order,
  renewsOn,
}: {
  team: TeamOrder;
  order: OrderDetailResponse;
  renewsOn: string | null;
}) {
  const money = (minor: number) => formatMoney(minor / 100, order.currency_code);
  const per = team.interval === "year" ? "سنوياً" : "شهرياً";
  const rows: [string, string][] = [
    ["الشركة", team.companyName ?? "—"],
    ["عدد الموظفين", `${team.seats} موظفاً`],
    ["السعر لكل موظف", `${money(team.unitMinor)} ${per}`],
    ["المجموع قبل الضريبة", money(team.subtotalMinor)],
    [team.taxPercent > 0 ? `ضريبة القيمة المضافة (${team.taxPercent}٪)` : "الضريبة", team.taxMinor > 0 ? money(team.taxMinor) : "—"],
  ];

  return (
    <section aria-labelledby="team-billing-title" className="flex flex-col gap-5 rounded-panel border border-line p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="team-billing-title" className="m-0 flex items-center gap-2 text-xl font-bold">
          <Users aria-hidden="true" className="size-5 fill-none text-accent" />
          تفاصيل الفوترة
        </h2>
        <Logo variant="business" height={15} />
      </div>
      <dl className="m-0 flex flex-col gap-3">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-baseline justify-between gap-4">
            <dt className="text-fg-muted">{label}</dt>
            <dd className="m-0 font-bold tabular-nums">{value}</dd>
          </div>
        ))}
        <div className="flex items-baseline justify-between gap-4 border-t border-line-strong pt-3">
          <dt className="text-lg font-bold">الإجمالي المدفوع {per}</dt>
          <dd className="m-0 text-2xl font-bold tabular-nums" dir="ltr">
            {money(team.totalMinor)}
          </dd>
        </div>
      </dl>
      <p className="m-0 text-sm leading-6 text-fg-muted">
        رقم الطلب <span dir="ltr">{orderNumber(order.order_id)}</span>
        {renewsOn ? ` · يتجدد تلقائياً في ${formatDate(renewsOn)} بنفس المبلغ` : null}
      </p>
    </section>
  );
}
