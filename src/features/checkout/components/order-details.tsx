import type { Route } from "next";

import { Money } from "@/components/shop/money";
import { AppLink } from "@/components/ui/app-link";
import { findPaymentMethod } from "@/features/cart/model/payment-methods";
import type { Order } from "@/lib/shop/contract";
import { kindLabel } from "@/lib/shop/labels";

const dateFormatter = new Intl.DateTimeFormat("ar-u-nu-latn", { dateStyle: "long", timeStyle: "short" });

/** An order's lines and totals, as the customer agreed to them. */
export function OrderDetails({ order, linked = true }: { order: Order; linked?: boolean }) {
  const method = findPaymentMethod(order.paymentMethod);
  const { totals } = order;

  return (
    <div className="flex flex-col gap-6 border border-line-strong bg-surface p-5 sm:p-6">
      <dl className="m-0 grid gap-x-8 gap-y-3 text-[15px] sm:grid-cols-3">
        <div>
          <dt className="text-sm text-fg-muted">رقم الطلب</dt>
          <dd dir="ltr" className="m-0 text-start font-bold tracking-wide">
            {order.number}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-fg-muted">التاريخ</dt>
          <dd className="m-0 font-bold">{dateFormatter.format(new Date(order.paidAt ?? order.createdAt))}</dd>
        </div>
        <div>
          <dt className="text-sm text-fg-muted">طريقة الدفع</dt>
          <dd className="m-0 font-bold">{method?.label ?? "بلا دفع (طلب مجاني)"}</dd>
        </div>
      </dl>

      <ul aria-label="منتجات الطلب" className="m-0 flex list-none flex-col p-0">
        {order.lines.map((line) => (
          <li key={line.key} className="flex flex-col gap-1 border-t border-line py-3">
            <div className="flex items-baseline justify-between gap-4">
              <span className="min-w-0">
                <span className="text-sm text-fg-muted">{kindLabel[line.kind]} · </span>
                {linked ? (
                  <AppLink href={line.href as Route} className="font-bold text-fg no-underline hover:underline">
                    {line.title}
                  </AppLink>
                ) : (
                  <span className="font-bold">{line.title}</span>
                )}
              </span>
              <Money amount={line.unitAmount} className="shrink-0 font-bold" />
            </div>
            {line.addons.map((addon) => (
              <div key={addon.code} className="flex items-baseline justify-between gap-4 text-sm text-fg-muted">
                <span>+ {addon.title}</span>
                <Money amount={addon.amount} className="shrink-0" />
              </div>
            ))}
            {line.discountAmount > 0 ? (
              <div className="flex items-baseline justify-between gap-4 text-sm text-fg-muted">
                <span>خصم القسيمة</span>
                <span className="shrink-0">
                  <span dir="ltr">−</span>
                  <Money amount={line.discountAmount} />
                </span>
              </div>
            ) : null}
          </li>
        ))}
      </ul>

      <dl className="m-0 flex flex-col gap-2 border-t border-line-strong pt-4 text-[15px]">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-fg-muted">المجموع</dt>
          <dd className="m-0 font-bold">
            <Money amount={totals.subtotal} />
          </dd>
        </div>
        {totals.discount > 0 ? (
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-fg-muted">
              خصم القسيمة{" "}
              {order.couponCode ? (
                <span dir="ltr" className="font-bold">
                  {order.couponCode}
                </span>
              ) : null}
            </dt>
            <dd className="m-0 font-bold">
              <span dir="ltr">−</span>
              <Money amount={totals.discount} />
            </dd>
          </div>
        ) : null}
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-lg font-bold">الإجمالي</dt>
          <dd className="m-0 text-2xl font-bold">
            <Money amount={totals.total} />
          </dd>
        </div>
      </dl>
    </div>
  );
}
