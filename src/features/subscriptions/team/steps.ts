/** The company checkout: two pages here, then Stripe (shown so the buyer knows payment comes last). */
export const TEAM_STEPS = [
  { id: "details", label: "بيانات الفريق" },
  { id: "review", label: "مراجعة الاشتراك" },
  { id: "payment", label: "الدفع الآمن" },
] as const;

export type TeamStepId = "details" | "review";

export function isTeamStep(value: string): value is TeamStepId {
  return value === "details" || value === "review";
}

export function teamStepIndex(step: string | null | undefined): number {
  return TEAM_STEPS.findIndex((item) => item.id === step);
}
