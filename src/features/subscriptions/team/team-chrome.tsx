"use client";

import { ArrowRight } from "lucide-react";
import { useSelectedLayoutSegment } from "next/navigation";

import { Logo } from "@/components/brand/logo";
import { FlowProgress } from "@/components/flow/flow-progress";
import { AppLink } from "@/components/ui/app-link";
import { routes } from "@/config/routes";

import { TEAM_STEPS, teamStepIndex } from "./steps";

/** The focused team checkout header: eMastery Business logo, the way back to the plan, the step progress. */
export function TeamChrome({ slug }: { slug: string }) {
  const segment = useSelectedLayoutSegment();
  const current = Math.max(teamStepIndex(segment), 0);

  return (
    <header className="border-b border-line bg-surface">
      <div className="ma-container flex flex-col gap-5 py-5">
        <div className="flex items-center justify-between gap-4">
          <AppLink href={routes.business} aria-label="eMastery Business — حلول الشركات" className="flex shrink-0 items-center">
            <Logo variant="business" height={17} />
          </AppLink>
          <AppLink href={routes.subscription(slug)} className="ma-btn ma-btn--ghost ma-btn--sm min-h-11 gap-1.5 no-underline">
            <ArrowRight aria-hidden="true" className="size-4 fill-none" />
            تفاصيل الباقة
          </AppLink>
        </div>
        <FlowProgress steps={TEAM_STEPS} current={current} label="تقدّم اشتراك فريقك" />
      </div>
    </header>
  );
}
