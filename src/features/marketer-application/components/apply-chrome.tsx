"use client";

import { ArrowRight } from "lucide-react";
import { useSelectedLayoutSegment } from "next/navigation";

import { Logo } from "@/components/brand/logo";
import { FlowProgress } from "@/components/flow/flow-progress";
import { AppLink } from "@/components/ui/app-link";
import { routes } from "@/config/routes";

import { APPLY_STEPS, stepIndex } from "../model/steps";

/** The focused application header: logo, the way back to `/marketers` and the step progress. */
export function ApplyChrome() {
  const segment = useSelectedLayoutSegment();
  const finished = segment === "done";
  const current = finished ? APPLY_STEPS.length : Math.max(stepIndex(segment), 0);

  return (
    <header className="border-b border-line bg-surface">
      <div className="ma-container flex flex-col gap-5 py-5">
        <div className="flex items-center justify-between gap-4">
          <AppLink href={routes.home} aria-label="ماستري أكاديمي — الصفحة الرئيسية" className="flex shrink-0 items-center">
            <Logo priority className="w-40" />
          </AppLink>
          {finished ? null : (
            <AppLink href={routes.marketers} className="ma-btn ma-btn--ghost ma-btn--sm min-h-11 gap-1.5 no-underline">
              <ArrowRight aria-hidden="true" className="size-4 fill-none" />
              برنامج المسوقين
            </AppLink>
          )}
        </div>
        <FlowProgress steps={APPLY_STEPS} current={current} label="تقدّم طلب الانضمام كمسوّق" />
      </div>
    </header>
  );
}
