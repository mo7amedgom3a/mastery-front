import { Hourglass, WalletCards } from "lucide-react";

import { Money } from "@/components/shop/money";
import { ButtonLink } from "@/components/ui/button";
import { routes } from "@/config/routes";
import type { MyReferralsResponse } from "@/lib/api/referrals";
import { formatDate, fromMinor } from "@/lib/format";

/** A student referrer's reward: referral credit spent as a discount at checkout (never cash). */
export function StudentCredit({ data }: { data: MyReferralsResponse }) {
  return (
    <section
      aria-labelledby="referral-credit-heading"
      className="flex flex-wrap items-center justify-between gap-4 rounded-panel border border-green/30 bg-green/5 p-4 sm:p-5"
    >
      <div className="flex items-center gap-3">
        <div className="grid size-11 place-items-center rounded-control bg-green/10 text-green">
          <WalletCards aria-hidden="true" className="size-6" />
        </div>
        <div className="flex flex-col gap-0.5">
          <h2 id="referral-credit-heading" className="m-0 text-xs font-medium text-fg-muted">
            رصيدك من الإحالات — يُخصم تلقائياً عند الدفع
          </h2>
          <strong className="text-xl font-bold text-fg sm:text-2xl">
            <Money amount={fromMinor(data.referral_balance_minor)} />
          </strong>
          {data.referral_balance_expires_at && data.referral_balance_minor > 0 ? (
            <span className="text-xs text-fg-muted">استخدمه قبل {formatDate(data.referral_balance_expires_at)}</span>
          ) : null}
          {data.pending_reward_minor > 0 ? (
            <span className="inline-flex items-center gap-1 text-xs text-fg-muted">
              <Hourglass aria-hidden="true" className="size-3.5" />
              <Money amount={fromMinor(data.pending_reward_minor)} /> تُضاف بعد انتهاء فترة الانتظار
            </span>
          ) : null}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <ButtonLink href={routes.studentVouchers} variant="soft" className="gap-2 text-sm">
          عرض قسائم الرصيد
        </ButtonLink>
        <ButtonLink href={routes.studentCart} variant="primary" className="gap-2 text-sm">
          استخدمه عند الدفع
        </ButtonLink>
      </div>
    </section>
  );
}
