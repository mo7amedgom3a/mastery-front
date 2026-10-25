"use client";

import type { ReactNode } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import type { CatalogCategoriesResponse, OnboardingSkill } from "@/lib/api/catalog";

import { DraftProgressSync } from "./model/draft-progress";
import { useRequestHydrated } from "./model/request-store";
import type { RequestStepId } from "./model/steps";
import { BudgetStep } from "./steps/budget-step";
import { CompanyStep } from "./steps/company-step";
import { DepartmentsStep } from "./steps/departments-step";
import { NeedsStep } from "./steps/needs-step";
import { TrainingStep } from "./steps/training-step";

type RequestStepPageProps = {
  step: RequestStepId;
  /** Loaded on the server for the `needs` step only. */
  categories: CatalogCategoriesResponse;
  skills: readonly OnboardingSkill[];
};

/** One step of the company request, once the saved answers are loaded. */
export function RequestStepPage({ step, categories, skills }: RequestStepPageProps) {
  const hydrated = useRequestHydrated();

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
    case "company":
      content = <CompanyStep />;
      break;
    case "training":
      content = <TrainingStep />;
      break;
    case "departments":
      content = <DepartmentsStep />;
      break;
    case "budget":
      content = <BudgetStep />;
      break;
    case "needs":
      content = <NeedsStep categories={categories} skills={skills} />;
      break;
  }

  return <><DraftProgressSync step={step} />{content}</>;
}
