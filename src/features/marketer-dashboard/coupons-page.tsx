"use client";

import { useQuery } from "@tanstack/react-query";
import { Check, Copy, Share2, TicketPercent } from "lucide-react";
import { useState } from "react";

import { Money } from "@/components/shop/money";
import { Skeleton } from "@/components/ui/skeleton";
import { marketerQueries, type MarketerCoupon } from "@/lib/api/marketer";
import { cn } from "@/lib/cn";
import { formatDate, formatNumber, fromMinor } from "@/lib/format";

import { LoadError } from "./components/shared";

function discountLabel(coupon: MarketerCoupon): string {
  const value = Number(coupon.discount_value);
  return coupon.discount_type === "percent" ? `خصم ${value}%` : `خصم ${value} $`;
}

function CouponCard({ coupon }: { coupon: MarketerCoupon }) {
  const [copied, setCopied] = useState(false);
  const text = encodeURIComponent(`استخدم الكود ${coupon.code} واحصل على ${discountLabel(coupon)} في ماستري أكاديمي`);
  const conditions = [
    coupon.first_purchase_only ? "لأول عملية شراء" : null,
    coupon.min_subtotal_minor ? `لطلب من ${fromMinor(coupon.min_subtotal_minor)} $` : null,
    coupon.max_discount_minor && coupon.discount_type === "percent" ? `بحد أقصى ${fromMinor(coupon.max_discount_minor)} $` : null,
    coupon.per_customer_limit ? `${coupon.per_customer_limit} مرة لكل عميل` : null,
    coupon.ends_at ? `حتى ${formatDate(coupon.ends_at)}` : null,
  ].filter(Boolean);

  return (
    <li className={cn("flex flex-col gap-4 rounded-panel border bg-surface p-5", coupon.is_active ? "border-line-strong" : "border-line opacity-70")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="inline-flex items-center gap-2">
            <bdi dir="ltr" className="rounded-control border border-line bg-surface-alt px-2.5 py-1 font-mono text-lg font-bold tracking-wide">{coupon.code}</bdi>
            <span className={cn("ma-tag text-xs", coupon.is_active ? "ma-tag--green" : "ma-tag--soft")}>{coupon.is_active ? "فعّال" : "غير فعّال"}</span>
            {coupon.is_referral_code ? <span className="ma-tag ma-tag--sky text-xs">كود الإحالة</span> : null}
          </span>
          <strong className="text-base">{discountLabel(coupon)}</strong>
          {conditions.length ? <span className="text-xs text-fg-muted">{conditions.join(" · ")}</span> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="ma-btn ma-btn--primary gap-2 text-sm"
            disabled={!coupon.is_active}
            onClick={() => {
              void navigator.clipboard?.writeText(coupon.code);
              setCopied(true);
            }}
          >
            {copied ? <Check aria-hidden="true" className="size-4 fill-none" /> : <Copy aria-hidden="true" className="size-4 fill-none" />}
            {copied ? "تم النسخ" : "انسخ الكود"}
          </button>
          {coupon.is_active ? (
            <a className="ma-btn ma-btn--soft gap-2 text-sm" href={`https://wa.me/?text=${text}`} target="_blank" rel="noopener noreferrer">
              <Share2 aria-hidden="true" className="size-4 fill-none" /> واتساب
            </a>
          ) : null}
        </div>
      </div>
      <dl className="m-0 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <div><dt className="text-xs text-fg-muted">مرات الاستخدام</dt><dd className="m-0 font-bold tabular-nums">{formatNumber(coupon.uses)}{coupon.usage_limit ? ` / ${formatNumber(coupon.usage_limit)}` : ""}</dd></div>
        <div><dt className="text-xs text-fg-muted">عملاء</dt><dd className="m-0 font-bold tabular-nums">{formatNumber(coupon.customers)}</dd></div>
        <div><dt className="text-xs text-fg-muted">مبيعات بالكوبون</dt><dd className="m-0 font-bold"><Money amount={fromMinor(coupon.sales_minor)} /></dd></div>
        <div><dt className="text-xs text-fg-muted">خصم قدّمته للعملاء</dt><dd className="m-0 font-bold"><Money amount={fromMinor(coupon.discount_given_minor)} /></dd></div>
      </dl>
    </li>
  );
}

/** Coupons the team created for the marketer: share them; every use is attributed to the marketer. */
export function MarketerCouponsPage() {
  const coupons = useQuery(marketerQueries.coupons());
  if (coupons.isPending) return <Skeleton className="h-48" />;
  if (coupons.isError) return <LoadError />;
  if (coupons.data.length === 0) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-panel border border-line bg-surface p-6">
        <TicketPercent aria-hidden="true" className="size-8 text-accent" />
        <p className="m-0 text-fg-muted">
          لا كوبونات خاصة بك بعد. يُنشئ فريق ماستري الكوبونات للمسوقين — تواصل معنا إن احتجت كودًا لحملة معيّنة.
          يمكنك أيضًا مشاركة كود الإحالة من صفحة «نظرة عامة».
        </p>
      </div>
    );
  }
  return (
    <ul className="m-0 flex list-none flex-col gap-3 p-0">
      {coupons.data.map((coupon) => (
        <CouponCard key={coupon.promotion_id} coupon={coupon} />
      ))}
    </ul>
  );
}
