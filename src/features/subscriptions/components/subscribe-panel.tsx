"use client";

import { ArrowLeft, Info, Lock } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { useStartCheckout } from "@/features/checkout/api/use-start-checkout";
import { CheckoutRedirectOverlay } from "@/features/checkout/components/checkout-redirect-overlay";

import type { PlanVM } from "../model/plans";
import { clampSeats } from "../model/quote";
import { useTeamCheckoutStore } from "../model/team-checkout-store";
import { PreviewNotice, teamRangeLabel } from "./plan-card";

/**
 * Subscribe call to action on a plan page. Individuals go straight to Stripe; company plans pick a team
 * size here (with the live total) and continue to the team checkout: details, then review, then Stripe.
 * `preview` (admin live preview) shows a notice instead of starting checkout.
 */
export function SubscribePanel({ plan, preview = false }: { plan: PlanVM; preview?: boolean }) {
  if (plan.perSeat) return <TeamStart plan={plan} preview={preview} />;
  return <IndividualSubscribe plan={plan} preview={preview} />;
}

function IndividualSubscribe({ plan, preview }: { plan: PlanVM; preview: boolean }) {
  const checkout = useStartCheckout();
  return (
    <div className="flex flex-col gap-4">
      {preview ? (
        <PreviewNotice />
      ) : (
        <Button
          variant="primary"
          size="lg"
          block
          onClick={() => void checkout.start({ mode: "subscription", planId: plan.id })}
          disabled={checkout.busy}
          className={checkout.busy ? "is-loading" : undefined}
        >
          اشترك الآن
          {plan.offer ? <span dir="ltr">&nbsp;{plan.price}</span> : null}
        </Button>
      )}

      {checkout.error ? (
        <div className="ma-alert ma-alert--warning" role="alert">
          <Info aria-hidden="true" className="fill-none" />
          <div>
            <p className="ma-alert__text">{checkout.error}</p>
          </div>
        </div>
      ) : null}

      <p className="m-0 flex items-start gap-2 text-sm leading-6 text-fg-muted">
        <Lock aria-hidden="true" className="mt-1 size-4 shrink-0 fill-none" />
        دفع آمن عبر Stripe. يتجدد الاشتراك تلقائياً {plan.interval === "year" ? "كل سنة" : "كل شهر"} ويمكنك إلغاؤه متى شئت.
      </p>
      <CheckoutRedirectOverlay phase={checkout.phase} preparingText="جارٍ تجهيز اشتراكك…" />
    </div>
  );
}

function TeamStart({ plan, preview }: { plan: PlanVM; preview: boolean }) {
  const router = useRouter();

  const start = () => {
    const store = useTeamCheckoutStore.getState();
    store.start(plan.slug, clampSeats(plan, Math.max(plan.minSeats, 10)));
    store.setDirection(1);
    router.push(routes.subscriptionTeam(plan.slug, "details"));
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="m-0 text-sm leading-6 text-fg-muted">
        {teamRangeLabel(plan)}. تختار عدد الموظفين وترى الإجمالي قبل الدفع.
      </p>
      {preview ? (
        <PreviewNotice />
      ) : (
        <Button variant="primary" size="lg" block className="gap-2" onClick={start}>
          اشترك الآن
          <ArrowLeft aria-hidden="true" className="size-5 fill-none" />
        </Button>
      )}
      <ol className="m-0 flex list-none flex-col gap-2 p-0 text-sm leading-6 text-fg-muted">
        <li>١. بيانات الشركة والمسؤول عن الاشتراك</li>
        <li>٢. عدد الموظفين ومراجعة السعر النهائي</li>
        <li className="flex items-start gap-2">
          <Lock aria-hidden="true" className="mt-1 size-4 shrink-0 fill-none" />
          ٣. الدفع الآمن عبر Stripe. لا رسوم مخفية.
        </li>
      </ol>
    </div>
  );
}
