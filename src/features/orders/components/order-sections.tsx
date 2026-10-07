import { CalendarCheck, CalendarX, Infinity as Lifetime } from "lucide-react";
import type { Route } from "next";

import { Money } from "@/components/shop/money";
import { AppLink } from "@/components/ui/app-link";
import type {
  EntitlementResponse,
  OrderDetailResponse,
  OrderInvoiceResponse,
  OrderTransactionResponse,
} from "@/lib/api/commerce";
import { formatCount, formatDate, formatDateTime, fromMinor } from "@/lib/format";
import { shopItemHref, shopKeyFromSlug } from "@/lib/shop/catalog-ids";
import { parseShopKey } from "@/lib/shop/contract";
import { kindLabel } from "@/lib/shop/labels";

import { entitlementStatus, fulfillmentStatus, paymentStatus, transactionEvent } from "../model/status";
import { InvoiceDownloadButton } from "./invoice-download-button";
import { StatusTag } from "./status-tag";

/** Link and type label of a catalog product by its slug; null for products not sold on this site. */
function productLink(slug: string | null | undefined): { href: Route; kind: string } | null {
  const key = slug ? shopKeyFromSlug(slug) : null;
  const parsed = key ? parseShopKey(key) : null;
  return parsed ? { href: shopItemHref(parsed.kind, parsed.id) as Route, kind: kindLabel[parsed.kind] } : null;
}

export function OrderLines({ order }: { order: OrderDetailResponse }) {
  const lines = order.lines ?? [];
  return (
    <section aria-labelledby="order-lines-title" className="flex flex-col gap-4">
      <h2 id="order-lines-title" className="m-0 text-xl font-bold">
        المنتجات
      </h2>
      <ul className="m-0 flex list-none flex-col divide-y divide-line rounded-panel border border-line p-0">
        {lines.map((line) => {
          const link = productLink(line.slug);
          const title = line.title ?? line.slug ?? "منتج";
          return (
            <li key={line.order_item_id} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 p-4">
              <div className="flex min-w-0 flex-col items-start gap-1">
                {link ? <span className="ma-tag ma-tag--soft">{link.kind}</span> : null}
                {link ? (
                  <AppLink href={link.href} className="font-bold text-fg no-underline hover:underline">
                    {title}
                  </AppLink>
                ) : (
                  <span className="font-bold">{title}</span>
                )}
                {line.quantity > 1 ? <span className="text-sm text-fg-muted">الكمية: {line.quantity}</span> : null}
              </div>
              <Money amount={fromMinor(line.total_amount_minor)} className="font-bold" />
            </li>
          );
        })}
      </ul>
      <div className="flex items-baseline justify-between gap-4 border-t border-line-strong pt-4">
        <span className="text-lg font-bold">الإجمالي المدفوع</span>
        <Money amount={fromMinor(order.amount_minor)} className="text-2xl font-bold" />
      </div>
    </section>
  );
}

export function OrderInvoices({ orderId, invoices }: { orderId: string; invoices: OrderInvoiceResponse[] }) {
  return (
    <section aria-labelledby="order-invoices-title" className="flex flex-col gap-4">
      <h2 id="order-invoices-title" className="m-0 text-xl font-bold">
        الفاتورة
      </h2>
      {invoices.length === 0 ? (
        <p className="m-0 text-fg-muted">نجهّز فاتورتك الآن، وستصلك أيضاً على بريدك الإلكتروني.</p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {invoices.map((invoice) => (
            <li
              key={invoice.invoice_id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-panel border border-line p-4"
            >
              <div className="flex flex-col gap-1">
                <span className="font-bold">
                  فاتورة <span dir="ltr">{invoice.invoice_number ?? invoice.invoice_id.slice(0, 8).toUpperCase()}</span>
                </span>
                <span className="text-sm text-fg-muted">صدرت في {formatDate(invoice.issued_at)}</span>
              </div>
              <InvoiceDownloadButton orderId={orderId} invoiceId={invoice.invoice_id} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function OrderTransactions({ transactions }: { transactions: OrderTransactionResponse[] }) {
  if (transactions.length === 0) return null;
  return (
    <section aria-labelledby="order-transactions-title" className="flex flex-col gap-4">
      <h2 id="order-transactions-title" className="m-0 text-xl font-bold">
        المعاملات
      </h2>
      <div className="overflow-x-auto rounded-panel border border-line">
        <table className="w-full border-collapse text-start text-sm">
          <thead className="bg-surface-alt">
            <tr>
              <th scope="col" className="p-3 text-start font-bold">
                العملية
              </th>
              <th scope="col" className="p-3 text-start font-bold">
                الحالة
              </th>
              <th scope="col" className="p-3 text-start font-bold">
                المبلغ
              </th>
              <th scope="col" className="p-3 text-start font-bold">
                التاريخ
              </th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <tr key={transaction.transaction_id} className="border-t border-line">
                <td className="p-3">{transactionEvent(transaction.event_type)}</td>
                <td className="p-3">
                  <StatusTag status={paymentStatus(transaction.status)} />
                </td>
                <td className="p-3">
                  <Money amount={fromMinor(transaction.amount_minor)} />
                </td>
                <td className="p-3 text-fg-muted">
                  {transaction.created_at ? formatDateTime(transaction.created_at) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const DAY_MS = 24 * 60 * 60 * 1000;
const DAY_FORMS = { one: "يوم واحد", two: "يومان", few: "أيام", many: "يوماً" };

/** Days of access left, rounded up; null for lifetime access. */
function daysLeft(expiresAt: string | null | undefined, now: number): number | null {
  if (!expiresAt) return null;
  return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - now) / DAY_MS));
}

export function AccessCard({ entitlement, now }: { entitlement: EntitlementResponse; now: number }) {
  const link = productLink(entitlement.product_slug);
  const title = entitlement.product_title ?? entitlement.product_slug ?? "منتج";
  const remaining = daysLeft(entitlement.expires_at, now);
  return (
    <article className="flex flex-col gap-4 rounded-panel border border-line bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col items-start gap-1.5">
          {link ? <span className="ma-tag ma-tag--soft">{link.kind}</span> : null}
          <h3 className="m-0 text-lg leading-7 font-bold">
            {link ? (
              <AppLink href={link.href} className="text-fg no-underline hover:underline">
                {title}
              </AppLink>
            ) : (
              title
            )}
          </h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusTag status={entitlementStatus(entitlement.status)} />
          {entitlement.fulfillment_status ? <StatusTag status={fulfillmentStatus(entitlement.fulfillment_status)} /> : null}
        </div>
      </div>
      <dl className="m-0 grid gap-3 text-sm sm:grid-cols-2">
        <div className="flex items-center gap-2">
          <CalendarCheck aria-hidden="true" className="size-4 shrink-0 fill-none text-accent" />
          <dt className="text-fg-muted">يبدأ الوصول</dt>
          <dd className="m-0 font-bold">{formatDate(entitlement.starts_at)}</dd>
        </div>
        <div className="flex items-center gap-2">
          {entitlement.expires_at ? (
            <CalendarX aria-hidden="true" className="size-4 shrink-0 fill-none text-accent" />
          ) : (
            <Lifetime aria-hidden="true" className="size-4 shrink-0 fill-none text-accent" />
          )}
          <dt className="text-fg-muted">ينتهي الوصول</dt>
          <dd className="m-0 font-bold">{entitlement.expires_at ? formatDate(entitlement.expires_at) : "وصول مدى الحياة"}</dd>
        </div>
      </dl>
      {remaining !== null && entitlement.status === "active" ? (
        <p className="m-0 text-sm text-fg-muted">
          {remaining === 0 ? "ينتهي وصولك اليوم." : `يتبقّى ${formatCount(remaining, DAY_FORMS)} على انتهاء الوصول.`}
        </p>
      ) : null}
    </article>
  );
}
