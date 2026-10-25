import { notFound, redirect } from "next/navigation";

import { routes } from "@/config/routes";
import { isRequestStep } from "@/features/business-request/model/steps";
import { RequestStepPage } from "@/features/business-request/request-step-page";
import { getCatalogCategories, getOnboardingOptions } from "@/lib/api/catalog";

export default async function Page({ params }: PageProps<"/business/request/[step]">) {
  const { step } = await params;
  if (step === "contact") redirect(routes.businessRequest("company"));
  if (!isRequestStep(step)) notFound();
  // Only the "needs" step picks categories and skills; an empty list shows its "couldn't load" notice.
  const [categories, options] =
    step === "needs"
      ? await Promise.all([
          getCatalogCategories().catch(() => []),
          getOnboardingOptions().catch(() => ({ skills: [], tags: [], product_types: [] })),
        ])
      : [[], { skills: [] }];
  return <RequestStepPage step={step} categories={categories} skills={options.skills ?? []} />;
}
