"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ChevronLeft, ReceiptText } from "lucide-react";
import { useState } from "react";

import { Money } from "@/components/shop/money";
import { AppLink } from "@/components/ui/app-link";
import { ButtonLink } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/config/routes";
import { commerceQueries } from "@/lib/api/commerce";
import { formatCount, formatDate, fromMinor } from "@/lib/format";

import { StatusTag } from "./components/status-tag";
import { orderNumber, orderStatus } from "./model/status";

const PAGE_SIZE = 10;
const INVOICE_FORMS = { one: "فاتورة واحدة", two: "فاتورتان", few: "فواتير", many: "فاتورة" };

/** The student's orders, newest first, with their status and total. */
export function OrdersPage() {
  const [offset, setOffset] = useState(0);
  const orders = useQuery({
    ...commerceQueries.orders({ limit: PAGE_SIZE, offset }),
    placeholderData: keepPreviousData,
  });

  if (orders.isPending) {
    return (
      <div role="status" className="flex flex-col gap-3">
        <span className="sr-only">جارٍ تحميل الطلبات…</span>
        {[0, 1, 2].map((index) => (
          <Skeleton key={index} className="h-20" />
        ))}
      </div>
    );
  }
  if (orders.isError) {
    return (
      <div className="ma-alert ma-alert--warning" role="alert">
        <div>
          <p className="ma-alert__title">تعذّر تحميل طلباتك</p>
          <p className="ma-alert__text">
            <button type="button" onClick={() => void orders.refetch()} className="cursor-pointer border-0 bg-transparent p-0 font-[inherit] font-bold underline">
              أعد المحاولة
            </button>
          </p>
        </div>
      </div>
    );
  }

  const { items, total } = orders.data;
  if (total === 0) {
    return (
      <div className="flex flex-col items-start gap-4 rounded-panel border border-line p-6 md:p-10">
        <ReceiptText aria-hidden="true" className="size-8 fill-none text-accent" />
        <h2 className="m-0 text-2xl font-bold">لا طلبات بعد</h2>
        <p className="m-0 text-fg-muted">عندما تشتري دورة أو دبلوماً أو باقة، ستجد الطلب وفاتورته هنا.</p>
        <ButtonLink href={routes.search} variant="primary">
          تصفّح البرامج
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <ul aria-busy={orders.isFetching} className="m-0 flex list-none flex-col gap-3 p-0">
        {items.map((order) => (
          <li key={order.order_id}>
            <AppLink
              href={routes.studentOrder(order.order_id)}
              className="flex flex-wrap items-center justify-between gap-4 rounded-panel border border-line bg-surface p-4 text-fg no-underline hover:border-line-strong sm:p-5"
            >
              <div className="flex min-w-0 flex-col gap-1">
                <span className="font-bold">
                  طلب رقم <span dir="ltr">{orderNumber(order.order_id)}</span>
                </span>
                <span className="text-sm text-fg-muted">
                  {formatDate(order.placed_at ?? order.created_at ?? new Date().toISOString())}
                  {order.invoice_count > 0 ? ` · ${formatCount(order.invoice_count, INVOICE_FORMS)}` : ""}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <StatusTag status={orderStatus(order.status)} />
                <Money amount={fromMinor(order.amount_minor)} className="font-bold" />
                <ChevronLeft aria-hidden="true" className="size-5 fill-none text-fg-muted" />
              </div>
            </AppLink>
          </li>
        ))}
      </ul>
      {total > PAGE_SIZE ? (
        <nav aria-label="صفحات الطلبات" className="flex items-center justify-between gap-4">
          <button
            type="button"
            disabled={offset === 0}
            onClick={() => setOffset((value) => Math.max(0, value - PAGE_SIZE))}
            className="ma-btn ma-btn--soft ma-btn--sm min-h-11"
          >
            الأحدث
          </button>
          <span className="text-sm text-fg-muted">
            {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} من {total}
          </span>
          <button
            type="button"
            disabled={offset + PAGE_SIZE >= total}
            onClick={() => setOffset((value) => value + PAGE_SIZE)}
            className="ma-btn ma-btn--soft ma-btn--sm min-h-11"
          >
            الأقدم
          </button>
        </nav>
      ) : null}
    </div>
  );
}
