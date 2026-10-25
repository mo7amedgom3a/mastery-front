"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Banknote,
  CheckCircle2,
  Clock,
  Link2,
  MousePointerClick,
  Percent,
  ReceiptText,
  ShoppingBag,
  TicketPercent,
  TrendingUp,
  UserRoundCog,
  Users,
  Wallet,
} from "lucide-react";
import { useState } from "react";

import { Money } from "@/components/shop/money";
import { ButtonLink } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/config/routes";
import { marketerQueries } from "@/lib/api/marketer";
import { cn } from "@/lib/cn";
import { formatDate, formatMoney, formatNumber, fromMinor } from "@/lib/format";

import { BarChart } from "./components/bar-chart";
import { COMMISSION_STATUS, dayLabel, LoadError, ReferralLinkCard, StatTile, StatusTag } from "./components/shared";

const RANGES = [
  { days: 7, label: "7 أيام" },
  { days: 30, label: "30 يومًا" },
  { days: 90, label: "90 يومًا" },
] as const;

const money = (minor: number) => formatMoney(fromMinor(minor));

/** Dashboard home: KPIs, daily charts, the referral link, Tolt tracking and recent sales. */
export function MarketerOverviewPage() {
  const [days, setDays] = useState<number>(30);
  const overview = useQuery(marketerQueries.overview(days));
  const recent = useQuery(marketerQueries.sales({ offset: 0, limit: 5 }));

  if (overview.isPending) {
    return (
      <div role="status" className="flex flex-col gap-3">
        <span className="sr-only">جارٍ التحميل…</span>
        <Skeleton className="h-28" />
        <Skeleton className="h-56" />
      </div>
    );
  }
  if (overview.isError) return <LoadError />;

  const { partner, program, stats, balance, tolt, series } = overview.data;
  const totals = series.reduce(
    (sum, d) => ({
      revenue: sum.revenue + d.revenue_minor,
      signups: sum.signups + d.signups,
      commission: sum.commission + d.commission_minor,
      orders: sum.orders + d.orders,
    }),
    { revenue: 0, signups: 0, commission: 0, orders: 0 },
  );
  const points = (pick: (d: (typeof series)[number]) => number) =>
    series.map((d) => ({ key: String(d.day), label: dayLabel(String(d.day)), value: pick(d) }));

  return (
    <div className={cn("flex flex-col gap-6", overview.isPlaceholderData && "opacity-70")}>
      <ReferralLinkCard link={partner.link} code={partner.referral_code} />

      {stats && balance ? (
        <section aria-labelledby="kpi-title" className="flex flex-col gap-3">
          <h2 id="kpi-title" className="m-0 text-lg font-bold">الأداء منذ انضمامك</h2>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile label="نقرات الرابط (Tolt)" value={tolt?.clicks != null ? formatNumber(tolt.clicks) : "—"} icon={MousePointerClick} />
            <StatTile label="عملاء سجّلوا عبرك" value={formatNumber(stats.customers)} note={`${formatNumber(stats.paying_customers)} اشتروا`} icon={Users} />
            <StatTile label="معدل التحويل" value={stats.conversion_rate != null ? `${stats.conversion_rate}%` : "—"} note="من سجّل ثم اشترى" icon={Percent} />
            <StatTile label="الطلبات" value={formatNumber(stats.orders)} icon={ShoppingBag} />
            <StatTile label="إجمالي المبيعات" value={<Money amount={fromMinor(stats.revenue_minor)} />} icon={TrendingUp} tone="accent" />
            <StatTile label="عمولات بانتظار الاعتماد" value={<Money amount={fromMinor(stats.commission_pending_minor)} />} icon={Clock} />
            <StatTile label="عمولات صُرفت لك" value={<Money amount={fromMinor(stats.commission_paid_minor)} />} icon={CheckCircle2} />
            <StatTile
              label="الرصيد المتاح للصرف"
              value={<Money amount={fromMinor(balance.available_minor)} />}
              note={balance.held_minor > 0 ? `${money(balance.held_minor)} في طلب صرف` : undefined}
              icon={Wallet}
              tone="green"
            />
          </div>
        </section>
      ) : null}

      <section aria-labelledby="charts-title" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="charts-title" className="m-0 text-lg font-bold">النشاط اليومي</h2>
          <div role="group" aria-label="الفترة" className="flex gap-1 rounded-full border border-line p-1">
            {RANGES.map((range) => (
              <button
                key={range.days}
                type="button"
                aria-pressed={days === range.days}
                onClick={() => setDays(range.days)}
                className={cn(
                  "min-h-9 rounded-full px-3 text-sm font-medium transition-colors",
                  days === range.days ? "bg-fg text-surface" : "text-fg hover:bg-surface-alt",
                )}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-3 xl:grid-cols-2">
          <BarChart title="المبيعات اليومية" data={points((d) => d.revenue_minor)} format={money}
            summary={<>{money(totals.revenue)} · {formatNumber(totals.orders)} طلب</>} />
          <BarChart title="العملاء الجدد" data={points((d) => d.signups)} format={(v) => formatNumber(Math.round(v))}
            summary={`${formatNumber(totals.signups)} عميل`} />
          <BarChart title="العمولات المستحقة" data={points((d) => d.commission_minor)} format={money}
            summary={money(totals.commission)} />
        </div>
      </section>

      <div className="grid gap-3 lg:grid-cols-2">
        <section aria-labelledby="tolt-title" className="flex flex-col gap-3 rounded-panel border border-line bg-surface p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 id="tolt-title" className="m-0 text-lg font-bold">التتبّع عبر Tolt</h2>
            <span className={cn("ma-tag text-xs", tolt?.connected ? "ma-tag--green" : "ma-tag--soft")}>
              {tolt?.connected ? "متصل" : "قيد الربط"}
            </span>
          </div>
          <dl className="m-0 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <dt className="text-fg-muted">نقرات مسجّلة</dt>
            <dd className="m-0 font-bold tabular-nums">{tolt?.clicks != null ? formatNumber(tolt.clicks) : "—"}</dd>
            <dt className="text-fg-muted">عملاء في Tolt</dt>
            <dd className="m-0 font-bold tabular-nums">{tolt?.customers != null ? formatNumber(tolt.customers) : "—"}</dd>
            <dt className="text-fg-muted">مدة التتبع (الكوكيز)</dt>
            <dd className="m-0 font-bold">{program.cookie_days} يومًا</dd>
            <dt className="text-fg-muted">نسبة العمولة</dt>
            <dd className="m-0 font-bold">{Number(program.commission_percent)}%</dd>
            <dt className="text-fg-muted">شروط الدفع</dt>
            <dd className="m-0 font-bold">{program.payout_terms}</dd>
            <dt className="text-fg-muted">الحد الأدنى للصرف</dt>
            <dd className="m-0 font-bold">{program.minimum_payout_minor > 0 ? money(program.minimum_payout_minor) : "بدون حد أدنى"}</dd>
          </dl>
          <p className="m-0 text-xs text-fg-muted">
            يحتسب Tolt العمولة لكل عملية شراء عبر رابطك أو كوبونك خلال مدة التتبع، وتُعتمد بعد انتهاء فترة الاسترداد.
          </p>
        </section>

        <section aria-labelledby="actions-title" className="flex flex-col gap-3 rounded-panel border border-line bg-surface p-5">
          <h2 id="actions-title" className="m-0 text-lg font-bold">إجراءات سريعة</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            <ButtonLink href={routes.marketerPayouts} variant="primary" className="justify-start gap-2">
              <Banknote aria-hidden="true" className="size-4 fill-none" /> طلب صرف العمولة
            </ButtonLink>
            <ButtonLink href={routes.marketerCoupons} variant="soft" className="justify-start gap-2">
              <TicketPercent aria-hidden="true" className="size-4 fill-none" /> كوبوناتي للمشاركة
            </ButtonLink>
            <ButtonLink href={routes.marketerCustomers} variant="soft" className="justify-start gap-2">
              <Users aria-hidden="true" className="size-4 fill-none" /> العملاء المحالون
            </ButtonLink>
            <ButtonLink href={routes.marketerProfile} variant="soft" className="justify-start gap-2">
              <UserRoundCog aria-hidden="true" className="size-4 fill-none" /> تعديل بياناتي
            </ButtonLink>
          </div>
          <p className="m-0 inline-flex items-center gap-1.5 text-xs text-fg-muted">
            <Link2 aria-hidden="true" className="size-3.5" />
            عضو منذ {partner.joined_at ? formatDate(partner.joined_at) : "—"}
          </p>
        </section>
      </div>

      <section aria-labelledby="recent-title" className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <h2 id="recent-title" className="m-0 text-lg font-bold">أحدث المبيعات</h2>
          <ButtonLink href={routes.marketerSales} variant="soft" className="text-sm">كل المبيعات</ButtonLink>
        </div>
        {recent.data && recent.data.items.length > 0 ? (
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {recent.data.items.map((sale) => (
              <li key={sale.order_ref + (sale.created_at ?? "")} className="flex flex-wrap items-center justify-between gap-3 rounded-panel border border-line bg-surface p-3">
                <span className="flex min-w-0 flex-col">
                  <span className="truncate font-medium">{sale.product_name ?? "طلب"} <span className="text-xs text-fg-muted">#{sale.order_ref}</span></span>
                  <span className="text-xs text-fg-muted">
                    <bdi dir="ltr">{sale.customer_email}</bdi> · {sale.created_at ? formatDate(sale.created_at) : ""}
                  </span>
                </span>
                <span className="flex items-center gap-3">
                  <span className="text-sm font-bold"><Money amount={fromMinor(sale.amount_minor)} /></span>
                  {sale.commission_minor != null ? (
                    <span className="text-sm text-fg-muted">عمولة <Money amount={fromMinor(sale.commission_minor)} /></span>
                  ) : null}
                  <StatusTag map={COMMISSION_STATUS} status={sale.commission_status} />
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="m-0 flex items-center gap-2 text-sm text-fg-muted">
            <ReceiptText aria-hidden="true" className="size-4" /> لا مبيعات بعد. شارك رابطك لتبدأ.
          </p>
        )}
      </section>
    </div>
  );
}
