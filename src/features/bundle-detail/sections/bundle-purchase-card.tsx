import { Award, CalendarCheck, Info, Layers, MonitorSmartphone, PiggyBank } from "lucide-react";
import type { ReactNode } from "react";

import { ButtonLink } from "@/components/ui/button";
import { routes } from "@/config/routes";

import { compositionLabel } from "../model/mappers";
import type { BundleDetailVM } from "../model/types";

/**
 * Price, savings and what's included. The cart only knows legacy items for now, so the call to
 * action signs the learner up and comes back here; checkout for bundles follows with the pricing API.
 */
export function BundlePurchaseCard({ bundle, share }: { bundle: BundleDetailVM; share?: ReactNode }) {
  const { price, savings } = bundle;
  const items = compositionLabel(bundle.composition);
  const facts = [
    items ? { icon: Layers, label: items } : null,
    bundle.access ? { icon: CalendarCheck, label: bundle.access } : null,
    { icon: MonitorSmartphone, label: "من الهاتف أو الحاسوب" },
    { icon: Award, label: "شهادة إتمام لكل برنامج" },
  ].filter((fact) => fact !== null);

  return (
    <aside aria-label="الاشتراك في الحزمة" className="rounded-panel border border-line-strong bg-surface p-6 lg:short:p-5">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 tabular-nums">
        {price.current ? (
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

      {savings ? (
        <p className="m-0 mt-4 flex items-start gap-3 bg-surface-alt p-3 text-sm leading-6">
          <PiggyBank aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-accent" />
          <span>
            <strong>
              وفّر <span dir="ltr">{savings.amount}</span> ({savings.percent}٪)
            </strong>{" "}
            مع عرض الحزمة لفترة محدودة
          </span>
        </p>
      ) : null}

      <div className="mt-5 lg:short:mt-4">
        <ButtonLink href={routes.registerThen(bundle.href)} block>
          اشترك في الحزمة
        </ButtonLink>
        <p className="m-0 mt-3 flex items-start gap-2 text-sm leading-6 text-fg-muted">
          <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          الدفع الإلكتروني للحزم يتوفر قريباً. أنشئ حسابك الآن وسنعيدك إلى هذه الصفحة.
        </p>
      </div>
      {share ? <div className="mt-3">{share}</div> : null}

      <h2 className="m-0 mt-8 text-sm font-bold lg:short:mt-5">تشمل الحزمة</h2>
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
