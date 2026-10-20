"use client";

import { ArrowRight } from "lucide-react";
import { useSelectedLayoutSegment } from "next/navigation";

import { FlowProgress } from "@/components/flow/flow-progress";
import { Logo } from "@/components/brand/logo";
import { AppLink } from "@/components/ui/app-link";
import { routes } from "@/config/routes";

import { REQUEST_STEPS, stepIndex } from "../model/steps";

/** The focused request header: logo, the way back to `/business` and the step progress. */
export function RequestChrome() {
  const segment = useSelectedLayoutSegment();
  const finished = segment === "done";
  const current = finished ? REQUEST_STEPS.length : Math.max(stepIndex(segment), 0);

  return (
    <header className="border-b border-line bg-surface">
      <div className="ma-container flex flex-col gap-5 py-5">
        <div className="flex items-center justify-between gap-4">
          <AppLink href={routes.business} aria-label="eMastery Business — حلول الشركات" className="flex shrink-0 items-center">
            <Logo variant="business" height={17} />
          </AppLink>
          {finished ? null : (
            <AppLink href={routes.business} className="ma-btn ma-btn--ghost ma-btn--sm min-h-11 gap-1.5 no-underline">
              <ArrowRight aria-hidden="true" className="size-4 fill-none" />
              حلول الشركات
            </AppLink>
          )}
        </div>
        <FlowProgress steps={REQUEST_STEPS} current={current} label="تقدّم طلب العرض التدريبي" />
      </div>
    </header>
  );
}
