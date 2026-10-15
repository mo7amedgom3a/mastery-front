import {
  BookOpen,
  CalendarCheck,
  CalendarX,
  GraduationCap,
  Infinity as Lifetime,
  Layers,
  MessagesSquare,
  Package,
  PlayCircle,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import type { Route } from "next";
import Image from "next/image";

import { Money } from "@/components/shop/money";
import { AppLink } from "@/components/ui/app-link";
import { brandBg, brandColorAt } from "@/components/ui/brand-colors";
import { buttonClass } from "@/components/ui/button";
import { productTypeLabel } from "@/features/student-dashboard/model/products";
import type {
  EntitlementResponse,
  OrderDetailResponse,
  OrderInvoiceResponse,
  OrderTransactionResponse,
} from "@/lib/api/commerce";
import { formatCount, formatDate, formatDateTime, fromMinor } from "@/lib/format";
import { shopItemHref, shopKeyFromSlug } from "@/lib/shop/product-links";
import { parseShopKey, type ResolvedItem } from "@/lib/shop/contract";
import { kindLabel } from "@/lib/shop/labels";
import { cn } from "@/lib/cn";

import { entitlementStatus, fulfillmentStatus, paymentStatus, transactionEvent } from "../model/status";
import { InvoiceDownloadButton } from "./invoice-download-button";
import { PaymentProvider } from "./payment-provider";
import { StatusTag } from "./status-tag";

/** Link, type label and id of a catalog product by its slug; null for products not sold on this site. */
function productLink(slug: string | null | undefined): { href: Route; kind: string; id: number } | null {
  const key = slug ? shopKeyFromSlug(slug) : null;
  const parsed = key ? parseShopKey(key) : null;
  return parsed
    ? { href: shopItemHref(parsed.kind, parsed.id) as Route, kind: kindLabel[parsed.kind], id: parsed.id }
    : null;
}

const THUMB_SIZES = "(min-width: 600px) 144px, 96px";

/** What the order bought, each line with its cover when the catalog knows the product. */
export function OrderLines({ order, artwork }: { order: OrderDetailResponse; artwork?: ReadonlyMap<string, ResolvedItem> }) {
  const lines = order.lines ?? [];
  return (
    <section aria-labelledby="order-lines-title" className="flex flex-col gap-4">
      <h2 id="order-lines-title" className="m-0 text-xl font-bold">
        المنتجات
      </h2>
      <ul className="m-0 flex list-none flex-col divide-y divide-line rounded-panel border border-line p-0">
        {lines.map((line, index) => {
          const link = productLink(line.slug);
          const known = line.slug ? artwork?.get(line.slug) : undefined;
          const title = known?.title ?? line.title ?? line.slug ?? "منتج";
          return (
            <li key={line.order_item_id} className="flex items-center gap-4 p-4">
              <div
                className={cn(
                  "relative grid aspect-[16/10] w-24 shrink-0 place-items-center overflow-hidden rounded-photo sm:w-36",
                  brandBg[brandColorAt(index)],
                )}
              >
                {known?.image ? (
                  <Image src={known.image} alt="" fill sizes={THUMB_SIZES} className="object-cover" />
                ) : (
                  <PlayCircle aria-hidden="true" className="size-8 fill-none text-ink" strokeWidth={1.5} />
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
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
                <Money amount={fromMinor(line.total_amount_minor)} currency={order.currency_code} className="font-bold" />
              </div>
            </li>
          );
        })}
      </ul>
      <div className="flex items-baseline justify-between gap-4 border-t border-line-strong pt-4">
        <span className="text-lg font-bold">الإجمالي المدفوع</span>
        <Money amount={fromMinor(order.amount_minor)} currency={order.currency_code} className="text-2xl font-bold" />
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
                طريقة الدفع
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
                  <PaymentProvider provider={transaction.provider} />
                </td>
                <td className="p-3">
                  <StatusTag status={paymentStatus(transaction.status)} />
                </td>
                <td className="p-3">
                  <Money amount={fromMinor(transaction.amount_minor)} currency={transaction.currency_code} />
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

/** Each order line's title by product slug, for naming the access an order opened. */
export function lineTitles(order: OrderDetailResponse | undefined): Map<string, string> {
  const titles = new Map<string, string>();
  for (const line of order?.lines ?? []) {
    if (line.slug && line.title) titles.set(line.slug, line.title);
  }
  return titles;
}

type AccessCardProps = {
  entitlement: EntitlementResponse;
  now: number;
  /** The product's name when the caller knows it (the catalog's, or the order line's). */
  title?: string;
  /** Catalog artwork and lead instructor, when the shop knows the product (see `useCatalogArtwork`). */
  image?: string | null;
  instructor?: string | null;
  /** Position in the list, for the media's fallback colour. */
  index?: number;
};

const CARD_SIZES = "(min-width: 1200px) 320px, (min-width: 600px) 50vw, 100vw";

const typeIcon: Record<string, LucideIcon> = {
  course: BookOpen,
  diploma: GraduationCap,
  package: Package,
  consultation: MessagesSquare,
  bundle: Layers,
};

/** Share of a time-limited access already used, 0–100; null for lifetime access. */
function elapsedPercent(startsAt: string | null | undefined, expiresAt: string | null | undefined, now: number): number | null {
  if (!expiresAt || !startsAt) return null;
  const start = new Date(startsAt).getTime();
  const span = new Date(expiresAt).getTime() - start;
  if (!(span > 0)) return null;
  return Math.min(100, Math.max(0, Math.round(((now - start) / span) * 100)));
}

/**
 * Something the student can open: artwork, type and name, how long access lasts (a bar of the time
 * used for time-limited access), and the way into it.
 */
export function AccessCard({ entitlement, now, title: knownTitle, image, instructor, index = 0 }: AccessCardProps) {
  const link = productLink(entitlement.product_slug);
  const typeLabel = link?.kind ?? (entitlement.product_type ? productTypeLabel(entitlement.product_type) : null);
  // The API falls back to the catalog slug (`course-4`) for untranslated products; never show it.
  const apiTitle = entitlement.product_title !== entitlement.product_slug ? entitlement.product_title : null;
  // A product that left the catalog has no name anywhere: its type and number still tell them apart.
  const title = knownTitle ?? apiTitle ?? (link ? `${link.kind} رقم ${link.id}` : (typeLabel ?? "منتج"));
  const active = entitlement.status === "active";
  const remaining = daysLeft(entitlement.expires_at, now);
  const used = active ? elapsedPercent(entitlement.starts_at, entitlement.expires_at, now) : null;
  const TypeIcon = (entitlement.product_type ? typeIcon[entitlement.product_type] : undefined) ?? PlayCircle;

  return (
    <article className="ma-card relative h-full">
      <div className={cn("ma-card__media relative grid place-items-center overflow-hidden p-0", brandBg[brandColorAt(index)])}>
        {image ? (
          <Image src={image} alt="" fill sizes={CARD_SIZES} className="object-cover" />
        ) : (
          <TypeIcon aria-hidden="true" className="size-12 fill-none text-ink" strokeWidth={1.5} />
        )}
        <span className="ma-tag ma-tag--cream absolute start-4 top-4 z-10">{typeLabel}</span>
      </div>
      <div className="ma-card__body">
        <div className="flex flex-wrap gap-2">
          <StatusTag status={entitlementStatus(entitlement.status)} />
          {entitlement.fulfillment_status ? <StatusTag status={fulfillmentStatus(entitlement.fulfillment_status)} /> : null}
        </div>
        <h3 className="ma-card__title line-clamp-2">{title}</h3>
        {instructor ? (
          <p className="m-0 flex items-center gap-2 text-sm text-fg-muted">
            <UserRound aria-hidden="true" className="size-4 shrink-0 fill-none text-accent" />
            <bdi className="truncate">{instructor}</bdi>
          </p>
        ) : null}
        <dl className="m-0 mt-auto grid gap-2 text-sm">
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
        {used !== null && remaining !== null ? (
          <div className="ma-progress">
            <div className="ma-progress__row">
              <span>{remaining === 0 ? "ينتهي وصولك اليوم" : `يتبقّى ${formatCount(remaining, DAY_FORMS)}`}</span>
              <span>{used}%</span>
            </div>
            <div
              className="ma-progress__track"
              role="progressbar"
              aria-label="المدة المستخدمة من الوصول"
              aria-valuenow={used}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div className="ma-progress__bar" style={{ width: `${used}%` }} />
            </div>
          </div>
        ) : null}
      </div>
      {link ? (
        <div className="ma-card__foot">
          <AppLink
            href={link.href}
            aria-label={`${active ? "كمّل التعلّم" : "عرض البرنامج"}: ${title}`}
            className={cn(buttonClass({ variant: active ? "primary" : "soft", block: true }), "gap-2")}
          >
            <PlayCircle aria-hidden="true" className="size-5 fill-none" />
            {active ? "كمّل التعلّم" : "عرض البرنامج"}
          </AppLink>
        </div>
      ) : null}
    </article>
  );
}
