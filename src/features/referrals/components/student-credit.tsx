import { CheckCircle2, Hourglass, WalletCards } from "lucide-react";

import { Money } from "@/components/shop/money";
import { ButtonLink } from "@/components/ui/button";
import { routes } from "@/config/routes";
import type { MyReferralsResponse } from "@/lib/api/referrals";
import { formatDate, fromMinor } from "@/lib/format";

type Reward = MyReferralsResponse["rewards"][number];

/** One friend's purchase: the reward is pending until the hold ends, then it is store credit. */
function RewardRow({ reward }: { reward: Reward }) {
  const pending = reward.status === "pending";
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 rounded-panel border border-line bg-surface px-3 py-2 text-sm">
      <span className="flex min-w-0 items-center gap-2">
        {pending ? (
          <Hourglass aria-hidden="true" className="size-4 shrink-0 text-fg-muted" />
        ) : (
          <CheckCircle2 aria-hidden="true" className="size-4 shrink-0 text-green" />
        )}
        <span className="truncate">
          {reward.referred_name || <bdi dir="ltr">{reward.referred_email}</bdi>} أتمّ الشراء
          {reward.created_at ? <span className="text-fg-muted"> · {formatDate(reward.created_at)}</span> : null}
        </span>
      </span>
      <span className="flex items-center gap-2">
        <strong className="tabular-nums">
          <Money amount={fromMinor(reward.amount_minor)} />
        </strong>
        {pending ? (
          <span className="ma-tag ma-tag--sky text-xs">قيد الانتظار — متاح في {formatDate(reward.eligible_at)}</span>
        ) : reward.status === "granted" ? (
          <span className="ma-tag ma-tag--green text-xs">أُضيف إلى رصيدك</span>
        ) : (
          <span className="ma-tag ma-tag--soft text-xs">أُلغي بسبب استرداد الطلب</span>
        )}
      </span>
    </li>
  );
}

/** A student referrer's reward: referral credit spent as a discount at checkout (never cash). */
export function StudentCredit({ data }: { data: MyReferralsResponse }) {
  const rewards = data.rewards ?? [];
  return (
    <div className="flex flex-col gap-3">
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
      {rewards.length > 0 ? (
        <section aria-labelledby="referral-rewards-heading" className="flex flex-col gap-2">
          <h2 id="referral-rewards-heading" className="m-0 text-base font-bold">
            مكافآت أصدقائك
          </h2>
          <p className="m-0 text-xs text-fg-muted">
            تظهر مكافأتك هنا فور إتمام صديقك للدفع، وتُضاف إلى رصيدك بعد {data.holding_days} يومًا إذا لم يُسترد الطلب.
          </p>
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {rewards.map((reward) => (
              <RewardRow key={reward.reward_id} reward={reward} />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
