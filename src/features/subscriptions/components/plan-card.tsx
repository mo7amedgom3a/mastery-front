import { Check, Clock } from "lucide-react";
import type { ReactNode } from "react";

import { ButtonLink } from "@/components/ui/button";

import { offerEndsLabel, PLAN_TYPE_LABELS, type PlanVM } from "../model/plans";
import { FeatureIcon } from "./feature-icon";

const PER: Record<PlanVM["interval"], string> = { month: "/ شهرياً", year: "/ سنوياً" };

/** The price block shared by the card and the plan page: offer price, struck list price, offer line. */
export function PlanPrice({ plan }: { plan: PlanVM }) {
  const ends = plan.offer ? offerEndsLabel(plan.offer.endsAt) : null;
  return (
    <div className="flex flex-col gap-2">
      <div className="ma-plan__price">
        {plan.originalPrice ? <span className="sr-only">السعر بعد الخصم</span> : null}
        <span dir="ltr" className="ma-plan__amount">
          {plan.price}
        </span>
        <span className="text-fg-muted">{PER[plan.interval]}</span>
        {plan.originalPrice ? (
          <>
            <span className="sr-only">بدلاً من</span>
            <del dir="ltr" className="ma-plan__was">
              {plan.originalPrice}
            </del>
          </>
        ) : null}
      </div>
      {plan.perMonth ? (
        <p className="m-0 text-sm text-fg-muted">
          أي <span dir="ltr">{plan.perMonth}</span> شهرياً، تُدفع مرة واحدة في السنة
        </p>
      ) : null}
      {plan.offer ? (
        <p className="m-0 flex flex-wrap items-center gap-2 text-sm font-bold">
          <span className="ma-tag ma-tag--coral">
            {plan.offer.label} · وفّر {plan.offer.percent}٪
          </span>
          {ends ? (
            <span className="inline-flex items-center gap-1 font-normal text-fg-muted">
              <Clock aria-hidden="true" className="size-4 fill-none" />
              ينتهي العرض في {ends}
            </span>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}

/**
 * One plan as the pricing page shows it. The spotlight plan (yearly with a live offer, or
 * featured by the admin) is wrapped in the animated glow — see styles/subscriptions.css.
 */
export function PlanCard({ plan, action }: { plan: PlanVM; action?: ReactNode }) {
  const highlights = plan.features.filter((f) => f.highlighted);
  const shown = highlights.length > 0 ? highlights : plan.features.slice(0, 5);
  const card = (
    <article className="ma-plan h-full" aria-labelledby={`plan-${plan.id}`}>
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {plan.spotlight ? <span className="ma-tag ma-tag--coral ma-plan__ribbon">الأفضل قيمة</span> : null}
          <span className="ma-tag ma-tag--soft">{PLAN_TYPE_LABELS[plan.planType]}</span>
          {plan.audience === "company" ? (
            <span className="ma-tag ma-tag--soft">حتى {plan.maxSeats} مقعد</span>
          ) : null}
        </div>
        <h3 id={`plan-${plan.id}`} className="m-0 text-2xl leading-9 font-bold">
          {plan.title}
        </h3>
        {plan.summary ? <p className="m-0 leading-7 text-fg-muted">{plan.summary}</p> : null}
      </div>

      <PlanPrice plan={plan} />

      {shown.length > 0 || plan.cardItems.length > 0 ? (
        <ul className="ma-plan__features" aria-label="ماذا تحصل">
          {shown.map((feature) => (
            <li key={feature.key}>
              <FeatureIcon name={feature.icon} />
              <span>
                <strong className="font-bold">{feature.title}</strong>
                {feature.value ? <span className="block text-sm text-fg-muted">{feature.value}</span> : null}
              </span>
            </li>
          ))}
          {plan.cardItems.map((item) => (
            <li key={item}>
              <span className="ma-plan__icon">
                <Check aria-hidden="true" />
              </span>
              <span className="pt-1">{item}</span>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="ma-plan__cta flex flex-col gap-2">
        {action ?? (
          <ButtonLink href={plan.href} variant={plan.spotlight ? "primary" : "secondary"} block>
            {plan.audience === "company" ? "اشترك لفريقك" : "اشترك الآن"}
          </ButtonLink>
        )}
        <ButtonLink href={plan.href} variant="bare" size="sm" block>
          تفاصيل الباقة وكل المزايا
        </ButtonLink>
      </div>
    </article>
  );
  return plan.spotlight ? <div className="ma-plan-glow h-full">{card}</div> : card;
}
