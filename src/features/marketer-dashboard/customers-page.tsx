"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { Money } from "@/components/shop/money";
import { Skeleton } from "@/components/ui/skeleton";
import { MARKETER_PAGE_SIZE, marketerQueries } from "@/lib/api/marketer";
import { cn } from "@/lib/cn";
import { formatDate, formatNumber, fromMinor } from "@/lib/format";

import { LoadError, Pager } from "./components/shared";

const SOURCE: Record<string, string> = {
  link: "رابط الإحالة",
  coupon: "كوبون",
  admin: "إسناد من الفريق",
  tolt_lead: "Tolt",
};

/** Customers who signed up through the marketer, masked (first name and part of the email). */
export function MarketerCustomersPage() {
  const [offset, setOffset] = useState(0);
  const customers = useQuery(marketerQueries.customers({ offset }));

  if (customers.isPending) return <Skeleton className="h-64" />;
  if (customers.isError) return <LoadError />;
  const { items, total } = customers.data;

  return (
    <div className={cn("flex flex-col gap-4", customers.isPlaceholderData && "opacity-70")}>
      <p className="m-0 text-sm text-fg-muted">
        نعرض الاسم الأول وجزءًا من البريد فقط حفاظًا على خصوصية العملاء. {formatNumber(total)} عميل حتى الآن.
      </p>
      {items.length === 0 ? (
        <p className="m-0 rounded-panel border border-line bg-surface p-6 text-fg-muted">لم يسجّل أحد عبر رابطك أو كوبونك بعد.</p>
      ) : (
        <div className="overflow-x-auto rounded-panel border border-line bg-surface">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-line bg-surface-alt/50 text-xs font-semibold text-fg-muted">
                <th scope="col" className="p-3 text-start">العميل</th>
                <th scope="col" className="p-3 text-start">انضم</th>
                <th scope="col" className="p-3 text-start">عبر</th>
                <th scope="col" className="p-3 text-end">الطلبات</th>
                <th scope="col" className="p-3 text-end">المشتريات</th>
                <th scope="col" className="p-3 text-end">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {items.map((customer, index) => (
                <tr key={`${customer.email}-${index}`}>
                  <td className="p-3">
                    <span className="flex flex-col">
                      <span className="font-medium">{customer.first_name ?? "—"}</span>
                      <bdi dir="ltr" className="text-xs text-fg-muted">{customer.email}</bdi>
                    </span>
                  </td>
                  <td className="p-3">{customer.joined_at ? formatDate(customer.joined_at) : "—"}</td>
                  <td className="p-3">{SOURCE[customer.source] ?? customer.source}</td>
                  <td className="p-3 text-end tabular-nums">{formatNumber(customer.orders)}</td>
                  <td className="p-3 text-end font-semibold"><Money amount={fromMinor(customer.revenue_minor)} /></td>
                  <td className="p-3 text-end">
                    <span className={cn("ma-tag text-xs", customer.orders > 0 ? "ma-tag--green" : "ma-tag--soft")}>
                      {customer.orders > 0 ? "اشترى" : "سجّل"}
                    </span>
                  </td>
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
