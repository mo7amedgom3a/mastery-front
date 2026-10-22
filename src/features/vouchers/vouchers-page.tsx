"use client";

import { useQuery } from "@tanstack/react-query";
import { WalletCards } from "lucide-react";

import { Money } from "@/components/shop/money";
import { ButtonLink } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/config/routes";
import { commerceQueries, type MyVoucherResponse } from "@/lib/api/commerce";
import { cn } from "@/lib/cn";
import { formatDate, fromMinor } from "@/lib/format";

const STATUS: Record<string, { label: string; tone: string }> = {
  active: { label: "فعّالة", tone: "ma-tag--green" },
  exhausted: { label: "مستخدمة بالكامل", tone: "ma-tag--soft" },
  expired: { label: "منتهية", tone: "ma-tag--pink" },
  revoked: { label: "ملغاة", tone: "ma-tag--pink" },
};

/** The student's vouchers: what is left on each, until when, and what was spent. */
export function VouchersPage() {
  const vouchers = useQuery(commerceQueries.myVouchers());

  if (vouchers.isPending) {
    return (
      <div role="status" className="flex flex-col gap-3">
        <span className="sr-only">جارٍ تحميل القسائم…</span>
        {[0, 1].map((index) => (
          <Skeleton key={index} className="h-24" />
        ))}
      </div>
    );
  }
  if (vouchers.isError) {
    return (
      <p role="alert" className="ma-alert ma-alert--warning m-0">
        تعذّر تحميل القسائم. حدّث الصفحة وحاول مجدداً.
      </p>
    );
  }

  const items = vouchers.data.items;
  const available = items
    .filter((voucher) => voucher.status === "active")
    .reduce((sum, voucher) => sum + voucher.spendable_minor, 0);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-start gap-4 rounded-panel border border-line p-6">
        <WalletCards aria-hidden="true" className="size-8 text-accent" />
        <p className="m-0 text-fg-muted">لا توجد لديك قسائم رصيد بعد. ستظهر هنا عندما نمنحك رصيداً لاستخدامه عند الدفع.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-panel border border-line-strong bg-surface p-5">
        <div className="flex flex-col gap-1">
          <span className="text-fg-muted">رصيدك المتاح</span>
          <strong className="text-3xl">
            <Money amount={fromMinor(available)} />
          </strong>
        </div>
        {available > 0 ? (
          <ButtonLink href={routes.studentCart} variant="primary">
            استخدمه في السلة
          </ButtonLink>
        ) : null}
      </div>
      <ul aria-label="قسائم الرصيد" className="m-0 flex list-none flex-col gap-3 p-0">
        {items.map((voucher) => (
          <li key={voucher.voucher_id}>
            <VoucherCard voucher={voucher} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function VoucherCard({ voucher }: { voucher: MyVoucherResponse }) {
  const status = STATUS[voucher.status] ?? { label: voucher.status, tone: "ma-tag--soft" };
  const active = voucher.status === "active";
  return (
    <article className={cn("flex flex-col gap-2 rounded-panel border border-line p-4", !active && "opacity-70")}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <bdi dir="ltr" className="text-lg font-bold">
          {voucher.code}
        </bdi>
        <span className={cn("ma-tag", status.tone)}>{status.label}</span>
      </div>
      <dl className="m-0 grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-fg-muted">القيمة</dt>
          <dd className="m-0 font-bold"><Money amount={fromMinor(voucher.initial_amount_minor)} /></dd>
        </div>
        <div>
          <dt className="text-fg-muted">المتاح</dt>
          <dd className="m-0 font-bold"><Money amount={fromMinor(voucher.spendable_minor)} /></dd>
        </div>
        <div>
          <dt className="text-fg-muted">المستخدم</dt>
          <dd className="m-0 font-bold"><Money amount={fromMinor(voucher.used_minor)} /></dd>
        </div>
        <div>
          <dt className="text-fg-muted">تنتهي</dt>
          <dd className="m-0 font-bold">{voucher.expires_at ? formatDate(voucher.expires_at) : "بلا انتهاء"}</dd>
        </div>
      </dl>
    </article>
  );
}
