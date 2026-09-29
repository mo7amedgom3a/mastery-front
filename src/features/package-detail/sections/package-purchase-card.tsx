import { Award, BookOpen, CalendarCheck, Clock, Layers, MonitorSmartphone, PiggyBank } from "lucide-react";
import type { ReactNode } from "react";

import { actionsFor } from "@/components/shop/card-actions-for";
import { formatCount } from "@/lib/format";

import { itemsLabel } from "../model/facts";
import type { PackageDetailVM } from "../model/types";

const LESSON_FORMS = { one: "درس واحد", two: "درسان", few: "دروس", many: "درساً" };

/** Price, savings against buying separately, cart/wishlist controls and what's included. */
export function PackagePurchaseCard({ product, share }: { product: PackageDetailVM; share?: ReactNode }) {
  const { price, savings } = product;
  const items = itemsLabel(product);
  const facts = [
    items ? { icon: Layers, label: items } : null,
    product.duration ? { icon: Clock, label: `${product.duration} من المحتوى` } : null,
    product.lessonCount > 0 ? { icon: BookOpen, label: formatCount(product.lessonCount, LESSON_FORMS) } : null,
    { icon: CalendarCheck, label: "وصول غير محدود لمدة عام" },
    { icon: MonitorSmartphone, label: "من الهاتف أو الحاسوب" },
    { icon: Award, label: "شهادة إتمام لكل برنامج" },
  ].filter((fact) => fact !== null);

  return (
    <aside aria-label="الاشتراك في الباقة" className="border border-line-strong bg-surface p-6">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 tabular-nums">
        {price.free ? (
          <span className="ma-tag ma-tag--green text-base font-bold">مجانية</span>
        ) : price.current ? (
          <>
            {price.original ? <span className="sr-only">السعر بعد الخصم</span> : null}
            <span dir="ltr" className="text-4xl font-bold">
              {price.current}
            </span>
          </>
        ) : (
          <span className="text-lg font-bold">السعر متاح عند الاشتراك</span>
        )}
        {price.original ? (
          <>
            <span className="sr-only">بدلاً من</span>
            <del dir="ltr" className="text-lg text-fg-muted">
              {price.original}
            </del>
          </>
        ) : null}
      </div>

      {savings ? (
        <p className="m-0 mt-4 flex items-start gap-3 bg-surface-alt p-3 text-sm leading-6">
          <PiggyBank aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-accent" />
          <span>
            <strong>
              وفّر <span dir="ltr">{savings.amount}</span> ({savings.percent}٪)
            </strong>{" "}
            مقارنة بشراء البرامج منفصلة بمجموع <span dir="ltr">{savings.separateTotal}</span>
          </span>
        </p>
      ) : null}

      <div className="mt-5">
        {actionsFor("package", {
          id: product.id,
          title: product.title,
          href: product.href,
          image: product.image,
          price: product.price,
          priceAmount: product.priceAmount,
        })}
      </div>
      {share ? <div className="mt-3">{share}</div> : null}

      <h2 className="m-0 mt-8 text-sm font-bold">تشمل الباقة</h2>
      <ul className="m-0 mt-3 grid list-none gap-3 p-0 text-[15px]">
        {facts.map(({ icon: Icon, label }) => (
          <li key={label} className="flex items-center gap-3">
            <Icon aria-hidden="true" className="size-5 shrink-0 text-accent" />
            {label}
          </li>
        ))}
      </ul>
    </aside>
  );
}
