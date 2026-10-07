"use client";

import { useQuery } from "@tanstack/react-query";

import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api/client";
import { commerceQueries } from "@/lib/api/commerce";
import { formatDateTime } from "@/lib/format";

import { AccessCard, OrderInvoices, OrderLines, OrderTransactions } from "./components/order-sections";
import { StatusTag } from "./components/status-tag";
import { orderNumber, orderStatus, paymentStatus } from "./model/status";

/** One order: what was bought, how it was paid (every transaction), its invoices and the access it opened. */
export function OrderDetailPage({ orderId }: { orderId: string }) {
  const order = useQuery(commerceQueries.order(orderId));
  const access = useQuery({
    ...commerceQueries.entitlements({ limit: 100 }),
    select: (page) => page.items.filter((entitlement) => entitlement.source_id === orderId),
  });

  if (order.isPending) {
    return (
      <div role="status" className="flex flex-col gap-4">
        <span className="sr-only">جارٍ تحميل الطلب…</span>
        <Skeleton className="h-24" />
        <Skeleton className="h-40" />
      </div>
    );
  }
  if (order.isError) {
    const notFound = order.error instanceof ApiError && order.error.status === 404;
    return (
      <div className="ma-alert ma-alert--warning" role="alert">
        <div>
          <p className="ma-alert__title">{notFound ? "لم نجد هذا الطلب" : "تعذّر تحميل الطلب"}</p>
          <p className="ma-alert__text">
            {notFound ? "قد يكون الرابط غير صحيح، أو الطلب مرتبطاً بحساب آخر." : "تحقّق من اتصالك ثم حدّث الصفحة."}
          </p>
        </div>
      </div>
    );
  }

  const detail = order.data;
  const placedAt = detail.placed_at ?? detail.created_at;
  return (
    <div className="flex flex-col gap-10">
      <dl className="m-0 grid gap-4 rounded-panel border border-line-strong bg-surface p-5 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-1">
          <dt className="text-fg-muted">رقم الطلب</dt>
          <dd className="m-0 font-bold" dir="ltr">
            {orderNumber(detail.order_id)}
          </dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-fg-muted">التاريخ</dt>
          <dd className="m-0 font-bold">{placedAt ? formatDateTime(placedAt) : "—"}</dd>
        </div>
        <div className="flex flex-col items-start gap-1">
          <dt className="text-fg-muted">حالة الطلب</dt>
          <dd className="m-0">
            <StatusTag status={orderStatus(detail.status)} />
          </dd>
        </div>
        <div className="flex flex-col items-start gap-1">
          <dt className="text-fg-muted">حالة الدفع</dt>
          <dd className="m-0">
            <StatusTag status={paymentStatus(detail.payment_status)} />
          </dd>
        </div>
      </dl>

      {access.data && access.data.length > 0 ? (
        <section aria-labelledby="order-access-title" className="flex flex-col gap-4">
          <h2 id="order-access-title" className="m-0 text-xl font-bold">
            الوصول
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {access.data.map((entitlement) => (
              <AccessCard key={entitlement.entitlement_id} entitlement={entitlement} now={access.dataUpdatedAt} />
            ))}
          </div>
        </section>
      ) : null}

      <OrderLines order={detail} />
      <OrderInvoices orderId={detail.order_id} invoices={detail.invoices ?? []} />
      <OrderTransactions transactions={detail.transactions ?? []} />
    </div>
  );
}
