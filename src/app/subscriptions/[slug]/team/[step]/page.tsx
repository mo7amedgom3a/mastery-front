import { notFound } from "next/navigation";

import { loadPlan } from "@/features/subscriptions/api/load-plans";
import { isTeamStep } from "@/features/subscriptions/team/steps";
import { TeamStepPage } from "@/features/subscriptions/team/team-step-page";

export default async function Page({ params }: PageProps<"/subscriptions/[slug]/team/[step]">) {
  const { slug, step } = await params;
  if (!isTeamStep(step)) notFound();
  const plan = await loadPlan(slug);
  // Only company plans are bought per employee; individual plans subscribe from their page.
  if (!plan || !plan.perSeat) notFound();
  return <TeamStepPage plan={plan} step={step} />;
}
