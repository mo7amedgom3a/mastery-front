import { Award, BookOpen, CalendarCheck, Clock, Gift, MonitorSmartphone } from "lucide-react";
import type { ReactNode } from "react";

import { actionsFor } from "@/components/shop/card-actions-for";
import { formatCount } from "@/lib/format";

import { kindLabel } from "../content/copy";
import type { ProductDetailVM } from "../model/types";

const LESSON_FORMS = { one: "درس واحد", two: "درسان", few: "دروس", many: "درساً" };
const FREE_LESSON_FORMS = { one: "درس مجاني", two: "درسان مجانيان", few: "دروس مجانية", many: "درساً مجانياً" };

/** Price, cart/wishlist controls and what's included. Sticky beside the content on large screens. */
export function PurchaseCard({ product, share }: { product: ProductDetailVM; share?: ReactNode }) {
  const { price } = product;
  const facts = [
    product.duration ? { icon: Clock, label: `${product.duration} من المحتوى` } : null,
    product.lessonCount > 0 ? { icon: BookOpen, label: formatCount(product.lessonCount, LESSON_FORMS) } : null,
    product.freeLessonCount > 0
      ? { icon: Gift, label: `منها ${formatCount(product.freeLessonCount, FREE_LESSON_FORMS)}` }
      : null,
    { icon: CalendarCheck, label: "وصول غير محدود لمدة عام" },
    { icon: MonitorSmartphone, label: "من الهاتف أو الحاسوب" },
    { icon: Award, label: "شهادة إتمام معتمدة" },
  ].filter((fact) => fact !== null);

  return (
    // `lg:short:` — beside the content on a short viewport, tighter spacing so the whole card fits.
    <aside
      aria-label={`الاشتراك في ${kindLabel[product.kind]}`}
      className="rounded-panel border border-line-strong bg-surface p-6 lg:short:p-5"
    >
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 tabular-nums">
        {price.free ? (
          <span className="ma-tag ma-tag--green text-base font-bold">مجاني</span>
        ) : price.current ? (
          <>
            {price.original ? <span className="sr-only">السعر بعد الخصم</span> : null}
            <span dir="ltr" className="text-4xl font-bold lg:short:text-3xl">
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

      <div className="mt-5 lg:short:mt-4">
        {actionsFor(product.kind, {
          id: product.id,
          title: product.title,
          href: product.href,
          image: product.image,
          price: product.price,
          priceAmount: product.priceAmount,
        })}
      </div>
      {share ? <div className="mt-3">{share}</div> : null}

      <h2 className="m-0 mt-8 text-sm font-bold lg:short:mt-5">يشمل الاشتراك</h2>
      <ul className="m-0 mt-3 grid list-none gap-3 p-0 text-[15px] lg:short:gap-2">
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
