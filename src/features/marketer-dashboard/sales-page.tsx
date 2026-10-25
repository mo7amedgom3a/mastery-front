"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { Money } from "@/components/shop/money";
import { Skeleton } from "@/components/ui/skeleton";
import { MARKETER_PAGE_SIZE, marketerQueries } from "@/lib/api/marketer";
import { cn } from "@/lib/cn";
import { formatDate, fromMinor } from "@/lib/format";

import { COMMISSION_STATUS, LoadError, Pager, SALE_STATUS, StatusTag } from "./components/shared";

/** Orders bought through the marketer's link or coupon, with the commission each one earned. */
export function MarketerSalesPage() {
  const [offset, setOffset] = useState(0);
  const sales = useQuery(marketerQueries.sales({ offset }));

  if (sales.isPending) return <Skeleton className="h-64" />;
  if (sales.isError) return <LoadError />;
  const { items, total } = sales.data;

  return (
    <div className={cn("flex flex-col gap-4", sales.isPlaceholderData && "opacity-70")}>
      {items.length === 0 ? (
        <p className="m-0 rounded-panel border border-line bg-surface p-6 text-fg-muted">لا مبيعات بعد. شارك رابطك أو كوبونك لتبدأ.</p>
      ) : (
        <div className="overflow-x-auto rounded-panel border border-line bg-surface">
          <table className="w-full min-w-[680px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-line bg-surface-alt/50 text-xs font-semibold text-fg-muted">
                <th scope="col" className="p-3 text-start">الطلب</th>
                <th scope="col" className="p-3 text-start">العميل</th>
                <th scope="col" className="p-3 text-end">قيمة الطلب</th>
                <th scope="col" className="p-3 text-end">عمولتك</th>
                <th scope="col" className="p-3 text-end">حالة العمولة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {items.map((sale) => (
                <tr key={`${sale.order_ref}-${sale.created_at}`}>
                  <td className="p-3">
                    <span className="flex flex-col gap-0.5">
                      <span className="font-medium">{sale.product_name ?? "طلب"}</span>
                      <span className="flex flex-wrap items-center gap-2 text-xs text-fg-muted">
                        <bdi dir="ltr" className="font-mono">#{sale.order_ref}</bdi>
                        {sale.created_at ? formatDate(sale.created_at) : null}
                        {sale.is_first_purchase ? <span className="ma-tag ma-tag--sky px-1.5 py-0.5 text-[10px]">أول شراء</span> : null}
                        {SALE_STATUS[sale.status] ? <StatusTag map={SALE_STATUS} status={sale.status} /> : null}
                      </span>
                    </span>
                  </td>
                  <td className="p-3"><bdi dir="ltr" className="text-xs">{sale.customer_email}</bdi></td>
                  <td className="p-3 text-end font-semibold"><Money amount={fromMinor(sale.amount_minor)} /></td>
                  <td className="p-3 text-end">
                    {sale.commission_minor != null ? <Money amount={fromMinor(sale.commission_minor)} /> : <span className="text-fg-muted">تُحسب قريبًا</span>}
                  </td>
                  <td className="p-3 text-end"><StatusTag map={COMMISSION_STATUS} status={sale.commission_status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pager offset={offset} limit={MARKETER_PAGE_SIZE} total={total} onChange={setOffset} />
    </div>
  );
}
