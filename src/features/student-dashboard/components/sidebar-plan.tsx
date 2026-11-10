"use client";

import { useQuery } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";

import { AppLink } from "@/components/ui/app-link";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/config/routes";
import { subscriptionQueries } from "@/lib/api/subscriptions";
import { formatDate, formatNumber } from "@/lib/format";
import { cn } from "@/lib/cn";

import { ProgressTrack } from "./progress-track";

/**
 * The demo sidebar's plan card: current plan and renewal date, plus expert-session credits. It sits
 * in the sidebar footer on desktop and in the mobile drawer. Pending and error states never shout.
 */
export function SidebarPlan() {
  const subscriptions = useQuery(subscriptionQueries.mine());
  const subscription =
    subscriptions.data?.find((item) => item.status === "active" || item.status === "trialing") ??
    subscriptions.data?.[0] ??
    null;
  const perks = useQuery({ ...subscriptionQueries.perks(), enabled: Boolean(subscription) });

  if (subscriptions.isPending) {
    return (
      <Skeleton className="h-24 rounded-photo" />
    );
  }
  if (subscriptions.isError) return null;

  if (!subscription) {
    return (
      <AppLink
        href={routes.subscriptions}
        className="flex flex-col gap-1 rounded-photo border border-line bg-surface p-3.5 no-underline"
      >
        <span className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles aria-hidden="true" className="size-4 fill-none text-accent" />
          اشترك في ماستري
        </span>
        <span className="text-xs leading-5 text-fg-muted">برامج غير محدودة وجلسات خبراء ضمن اشتراكك.</span>
      </AppLink>
    );
  }

  const canceling = subscription.cancel_at_period_end;
  const totalCredits = perks.data?.credits_per_period ?? 0;
  const remainingCredits = perks.data?.credits_remaining ?? 0;
  const hasPerks = perks.data?.has_perks === true && totalCredits > 0;

  return (
    <AppLink
      href={routes.studentSubscription}
      className="flex flex-col gap-2 rounded-photo border border-line bg-surface p-3.5 no-underline"
    >
      <span className="flex items-center justify-between gap-2 text-sm font-semibold">
        <span className="truncate">{subscription.plan_title ?? "اشتراكك"}</span>
        <span className={cn("ma-tag shrink-0", canceling ? "ma-tag--pink" : "ma-tag--green")}>
          {canceling ? "لن يتجدد" : "فعّال"}
        </span>
      </span>
      <span className="text-xs leading-5 text-fg-muted">
        {canceling ? "ينتهي" : "يتجدد"} في {formatDate(subscription.current_period_end)}
      </span>
      {hasPerks ? (
        <ProgressTrack
          value={remainingCredits}
          max={totalCredits}
          label="جلسات الخبراء المجانية"
          valueLabel={`${formatNumber(remainingCredits)} من ${formatNumber(totalCredits)}`}
          ariaLabel="جلسات الخبراء المجانية المتبقية"
          className="mt-1"
        />
      ) : null}
    </AppLink>
  );
}
