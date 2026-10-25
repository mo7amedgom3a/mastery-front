export const APPLY_STEPS = [
  { id: "you", label: "بياناتك" },
  { id: "address", label: "العنوان" },
  { id: "channels", label: "قنواتك" },
  { id: "plan", label: "الجمهور والخطة" },
  { id: "policy", label: "السياسة والإرسال" },
] as const;

export type ApplyStepId = (typeof APPLY_STEPS)[number]["id"];

export function isApplyStep(value: string): value is ApplyStepId {
  return APPLY_STEPS.some((step) => step.id === value);
}

/** 0-based position of a step; -1 for anything else (e.g. the "done" page). */
export function stepIndex(step: string | null | undefined): number {
  return APPLY_STEPS.findIndex((item) => item.id === step);
}

export function stepAt(index: number): ApplyStepId | null {
  return APPLY_STEPS[index]?.id ?? null;
}
