"use client";

import { useState } from "react";

import { useStudioChannel } from "@/features/preview/use-studio-channel";
import { PlanCard } from "@/features/subscriptions/components/plan-card";
import { toPlanVM, type PlanVM } from "@/features/subscriptions/model/plans";
import { PlanDetailPage } from "@/features/subscriptions/plan-detail-page";
import type { SubscriptionPlan } from "@/lib/api/subscriptions";

type View = "card" | "page";

/**
 * Admin live preview of a subscription plan (framed by the admin plan editor). The admin posts the plan in the
 * public API shape — saved data with unsaved edits on top — and this renders the real plan card or plan page.
 */
export default function SubscriptionPreviewPage() {
  const [state, setState] = useState<{ plan: PlanVM; view: View } | null>(null);

  useStudioChannel((message) => {
    if (message.type !== "render" || message.kind !== "subscription" || !message.plan) return;
    setState({ plan: toPlanVM(message.plan as SubscriptionPlan), view: message.view === "page" ? "page" : "card" });
  });

  if (!state) {
    return (
      <div className="grid min-h-screen place-items-center bg-surface p-8 text-center text-fg-muted" dir="rtl">
        <div className="flex flex-col items-center gap-4">
          <div className="size-9 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <p className="m-0 text-base font-semibold text-fg">جارٍ تجهيز المعاينة الحية…</p>
        </div>
      </div>
    );
  }

  if (state.view === "page") return <PlanDetailPage plan={state.plan} preview />;

  return (
    <main className="grid min-h-screen place-items-center bg-surface-alt px-4 py-10" dir="rtl">
      <div className="w-full max-w-[24rem]">
        <PlanCard plan={state.plan} preview />
      </div>
    </main>
  );
}
