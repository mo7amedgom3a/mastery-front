"use client";

import type { ReactNode } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import type { ProgramPolicy } from "@/features/marketers/model/policy";

import { useApplyHydrated } from "./model/apply-store";
import type { ApplyStepId } from "./model/steps";
import { AddressStep } from "./steps/address-step";
import { ChannelsStep } from "./steps/channels-step";
import { PlanStep } from "./steps/plan-step";
import { PolicyStep } from "./steps/policy-step";
import { YouStep } from "./steps/you-step";

/** One step of the marketer application, once the saved answers are loaded. */
export function ApplyStepPage({ step, policy }: { step: ApplyStepId; policy: ProgramPolicy | null }) {
  const hydrated = useApplyHydrated();

  if (!hydrated) {
    return (
      <div role="status" className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <span className="sr-only">جارٍ التحميل…</span>
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  let content: ReactNode;
  switch (step) {
    case "you":
      content = <YouStep />;
      break;
    case "address":
      content = <AddressStep />;
      break;
    case "channels":
      content = <ChannelsStep />;
      break;
    case "plan":
      content = <PlanStep />;
      break;
    case "policy":
      content = <PolicyStep policy={policy} />;
      break;
  }
  return content;
}
