"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { Money } from "@/components/shop/money";
import { Skeleton } from "@/components/ui/skeleton";
import { MARKETER_PAGE_SIZE, marketerQueries } from "@/lib/api/marketer";
import { cn } from "@/lib/cn";
import { formatDate, fromMinor } from "@/lib/format";

import { COMMISSION_STATUS, LoadError, Pager, StatusTag } from "./components/shared";

const FILTERS = [
  { value: "", label: "الكل" },
  { value: "pending", label: "بانتظار الاعتماد" },
  { value: "approved", label: "معتمدة" },
  { value: "paid", label: "صُرفت لك" },
  { value: "refunded", label: "مستردة" },
] as const;

/** Every commission Tolt calculated for the marketer and where it stands. */
export function MarketerCommissionsPage() {
  const [status, setStatus] = useState("");
  const [offset, setOffset] = useState(0);
  const commissions = useQuery(marketerQueries.commissions({ offset, status: status || undefined }));

  return (
    <div className="flex flex-col gap-4">
      <div className="ma-alert ma-alert--info m-0 text-sm" role="note">
        <p className="ma-alert__text m-0">
          تُنشأ العمولة عند كل عملية شراء وتكون «بانتظار الاعتماد» خلال فترة الاسترداد، ثم تُعتمد وتُضاف إلى رصيدك المتاح للصرف. العمولة المستردة تُخصم من رصيدك.
        </p>
      </div>
      <div role="group" aria-label="تصفية حسب الحالة" className="flex flex-wrap gap-2">
        {FILTERS.map((filter) => (
          <button
            key={filter.value}
            type="button"
            aria-pressed={status === filter.value}
            onClick={() => {
              setStatus(filter.value);
              setOffset(0);
            }}
            className={cn("ma-btn text-sm", status === filter.value ? "ma-btn--primary" : "ma-btn--soft")}
          >
            {filter.label}
          </button>
        ))}
      </div>
      {commissions.isPending ? (
        <Skeleton className="h-64" />
      ) : commissions.isError ? (
        <LoadError />
      ) : commissions.data.items.length === 0 ? (
        <p className="m-0 rounded-panel border border-line bg-surface p-6 text-fg-muted">لا عمولات بهذه الحالة.</p>
      ) : (
        <div className={cn("overflow-x-auto rounded-panel border border-line bg-surface", commissions.isPlaceholderData && "opacity-70")}>
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-line bg-surface-alt/50 text-xs font-semibold text-fg-muted">
                <th scope="col" className="p-3 text-start">التاريخ</th>
                <th scope="col" className="p-3 text-start">الطلب / العميل</th>
                <th scope="col" className="p-3 text-end">العمولة</th>
                <th scope="col" className="p-3 text-end">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {commissions.data.items.map((commission) => (
                <tr key={commission.commission_id}>
                  <td className="p-3">{commission.created_at ? formatDate(commission.created_at) : "—"}</td>
                  <td className="p-3">
                    <span className="flex flex-col">
                      <bdi dir="ltr" className="font-mono text-xs">{commission.order_ref ? `#${commission.order_ref}` : "—"}</bdi>
                      <bdi dir="ltr" className="text-xs text-fg-muted">{commission.customer_email}</bdi>
                    </span>
                  </td>
                  <td className="p-3 text-end font-semibold"><Money amount={fromMinor(commission.amount_minor)} /></td>
                  <td className="p-3 text-end">
                    <StatusTag map={COMMISSION_STATUS} status={commission.status} />
                    {commission.settled_at ? <span className="block text-[11px] text-fg-muted">في {formatDate(commission.settled_at)}</span> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {commissions.data ? (
        <Pager offset={offset} limit={MARKETER_PAGE_SIZE} total={commissions.data.total} onChange={setOffset} />
      ) : null}
    </div>
  );
}
