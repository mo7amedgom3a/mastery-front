export const REQUEST_STEPS = [
  { id: "company", label: "بيانات الشركة" },
  { id: "training", label: "التدريب المطلوب" },
  { id: "departments", label: "الأقسام" },
  { id: "budget", label: "الميزانية والخبرة" },
  { id: "needs", label: "المجالات والمهارات" },
] as const;

export type RequestStepId = (typeof REQUEST_STEPS)[number]["id"];

export function isRequestStep(value: string): value is RequestStepId {
  return REQUEST_STEPS.some((step) => step.id === value);
}

/** 0-based position of a step; -1 for anything else (e.g. the "done" page). */
export function stepIndex(step: string | null | undefined): number {
  return REQUEST_STEPS.findIndex((item) => item.id === step);
}

export function stepAt(index: number): RequestStepId | null {
  return REQUEST_STEPS[index]?.id ?? null;
}
