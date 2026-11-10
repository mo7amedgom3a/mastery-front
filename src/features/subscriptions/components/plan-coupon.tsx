"use client";

import { useQuery } from "@tanstack/react-query";
import { TicketPercent, X } from "lucide-react";
import { useState } from "react";

import { useCheckoutIncentives } from "@/features/checkout/model/incentives-store";
import { quoteSubscription, type SubscriptionQuote } from "@/lib/api/subscriptions";
import { useAuthStore } from "@/lib/auth/store";
import { formatMoney } from "@/lib/format";

const STATUS_TEXT: Record<string, string> = {
  invalid: "الكود غير صحيح.",
  inactive: "هذا الكوبون غير مفعّل حالياً.",
  not_started: "هذا الكوبون لم يبدأ بعد.",
  expired: "انتهت صلاحية هذا الكوبون.",
  not_applicable: "هذا الكوبون لا يشمل الاشتراكات.",
  min_not_met: "قيمة الاشتراك أقل من الحد الأدنى للكوبون.",
  limit_reached: "استُخدم هذا الكوبون بالحد الأقصى.",
  not_eligible: "هذا الكوبون غير متاح لحسابك.",
};

function durationText(quote: SubscriptionQuote): string {
  if (quote.discount_duration === "forever") return "على كل التجديدات";
  if (quote.discount_duration === "repeating" && quote.discount_months) return `لمدة ${quote.discount_months} شهر`;
  return "على أول فترة";
}

/**
 * The plan page's coupon: one carried from the announcement bar (or `?coupon=`), or typed by the visitor.
 * Signed-in visitors get the real price from `/subscriptions/quote`; `appliedCode` is the code checkout may send,
 * so a coupon that doesn't cover subscriptions never blocks the payment.
 */
export function usePlanCoupon(planId: string) {
  const code = useCheckoutIncentives((state) => state.couponCode);
  const signedIn = useAuthStore((state) => state.status === "authenticated");
  const quote = useQuery({
    queryKey: ["subscriptions", "quote", planId, code],
    queryFn: () => quoteSubscription({ plan_id: planId, coupon_code: code }),
    enabled: Boolean(signedIn && code),
    staleTime: 60_000,
  });
  const applied = quote.data?.coupon_status === "applied" ? quote.data : null;
  return { code, signedIn, quote, applied, appliedCode: applied?.coupon_code ?? null };
}

export function PlanCoupon({ planId, state }: { planId: string; state: ReturnType<typeof usePlanCoupon> }) {
  const { code, signedIn, quote, applied } = state;
  const setCoupon = useCheckoutIncentives((s) => s.setCoupon);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");

  if (!code) {
    return open ? (
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (draft.trim()) setCoupon(draft.trim());
        }}
      >
        <label className="sr-only" htmlFor={`plan-coupon-${planId}`}>
          كود الخصم
        </label>
        <input
          id={`plan-coupon-${planId}`}
          className="ma-input min-w-0 flex-1"
          dir="ltr"
          autoComplete="off"
          placeholder="SAVE20"
          value={draft}
          onChange={(event) => setDraft(event.target.value.toUpperCase())}
        />
        <button type="submit" className="ma-btn ma-btn--secondary ma-btn--sm">
          تطبيق
        </button>
      </form>
    ) : (
      <button type="button" className="ma-link self-start text-sm" onClick={() => setOpen(true)}>
        لديك كود خصم؟
      </button>
    );
  }

  const rejected = quote.data && !applied ? STATUS_TEXT[quote.data.coupon_status ?? "invalid"] ?? STATUS_TEXT.invalid : null;

  return (
    <div
      className={`flex items-start gap-3 rounded-control border border-dashed px-3 py-2 text-sm ${
        rejected ? "border-line" : "border-accent/60 bg-accent/10"
      }`}
      aria-live="polite"
    >
      <TicketPercent aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-accent" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span>
          كوبون{" "}
          <bdi dir="ltr" className="font-bold">
            {code}
          </bdi>
          {applied ? (
            <>
              {" "}
              — خصم <bdi dir="ltr">{formatMoney(Number(applied.discount), applied.currency_code)}</bdi> {durationText(applied)}
            </>
          ) : null}
        </span>
        {applied ? (
          <span className="text-fg-muted">
            تدفع الآن <bdi dir="ltr" className="font-semibold text-fg">{formatMoney(Number(applied.total), applied.currency_code)}</bdi>
            {applied.renewal_total !== applied.total ? (
              <>
                {" "}
                ثم <bdi dir="ltr">{formatMoney(Number(applied.renewal_total), applied.currency_code)}</bdi> عند التجديد
              </>
            ) : null}
          </span>
        ) : null}
        {!signedIn ? <span className="text-fg-muted">يُطبَّق الكوبون عند الدفع بعد تسجيل الدخول.</span> : null}
        {quote.isFetching && !quote.data ? <span className="text-fg-muted">جارٍ التحقق من الكوبون…</span> : null}
        {rejected ? <span className="text-fg-muted">{rejected}</span> : null}
      </div>
      <button type="button" className="ma-btn ma-btn--bare ma-btn--icon size-7" aria-label="إزالة الكوبون" onClick={() => setCoupon(null)}>
        <X aria-hidden="true" className="size-4" />
      </button>
    </div>
  );
}
