"use client";

import { Info, Lock } from "lucide-react";
import { useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { useStartCheckout } from "@/features/checkout/api/use-start-checkout";
import { CheckoutRedirectOverlay } from "@/features/checkout/components/checkout-redirect-overlay";

import type { PlanVM } from "../model/plans";

/**
 * Subscribe call to action on a plan page. Company plans ask for the number of seats (up to the
 * plan's limit; the plan price covers them all) and the company name. Guests sign in first.
 */
export function SubscribePanel({ plan }: { plan: PlanVM }) {
  const checkout = useStartCheckout();
  const seatsId = useId();
  const companyId = useId();
  const company = plan.audience === "company";
  const [seats, setSeats] = useState(Math.min(5, plan.maxSeats));
  const [companyName, setCompanyName] = useState("");
  const validSeats = Number.isInteger(seats) && seats >= 1 && seats <= plan.maxSeats;

  const subscribe = () => {
    if (company && (!validSeats || !companyName.trim())) return;
    void checkout.start({
      mode: "subscription",
      planId: plan.id,
      ...(company ? { seatCount: seats, companyName } : {}),
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {company ? (
        <div className="grid gap-3">
          <div className="ma-field">
            <label htmlFor={companyId} className="ma-label">
              اسم الشركة
            </label>
            <input id={companyId} className="ma-input" value={companyName} maxLength={255} onChange={(e) => setCompanyName(e.target.value)} />
          </div>
          <div className="ma-field">
            <label htmlFor={seatsId} className="ma-label">
              عدد المقاعد (حتى {plan.maxSeats})
            </label>
            <input
              id={seatsId}
              className="ma-input"
              type="number"
              inputMode="numeric"
              min={1}
              max={plan.maxSeats}
              value={seats}
              onChange={(e) => setSeats(Number(e.target.value))}
              aria-invalid={!validSeats || undefined}
            />
            <span className="ma-help">توزّع المقاعد على فريقك من حسابك بعد الاشتراك.</span>
          </div>
        </div>
      ) : null}

      <Button
        variant="primary"
        size="lg"
        block
        onClick={subscribe}
        disabled={checkout.busy || (company && (!validSeats || !companyName.trim()))}
        className={checkout.busy ? "is-loading" : undefined}
      >
        {company ? "اشترك لفريقك" : "اشترك الآن"}
        {plan.offer ? <span dir="ltr">&nbsp;{plan.price}</span> : null}
      </Button>

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
