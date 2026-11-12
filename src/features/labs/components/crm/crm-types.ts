/** Mock CRM data shapes shared by the pipeline board, the deal drawer and the lab content. */

export type DealHealth = "good" | "warn" | "bad";

export type PipelineStage = { id: string; label: string };

export type PipelineDeal = {
  id: string;
  title: string;
  company: string;
  /** Annual value, SAR. */
  value: number;
  owner: string;
  /** Days in the current stage. */
  ageDays: number;
  health: DealHealth;
  stage: string;
};

export type ActivityType = "email" | "call" | "meeting" | "note" | "ticket" | "system";

export type Activity = {
  id: string;
  type: ActivityType;
  /** "12 مارس" or "قبل 3 أيام". */
  at: string;
  by: string;
  title: string;
  body: string;
  /** Marks the item visually as a warning sign. */
  flag?: boolean;
};

/** The standard pipeline used by every deal-recovery lab. */
export const pipelineStages: readonly PipelineStage[] = [
  { id: "lead", label: "عميل محتمل" },
  { id: "proposal", label: "عرض مقدَّم" },
  { id: "negotiation", label: "تفاوض" },
  { id: "stalled", label: "متعثرة" },
  { id: "won", label: "مكسوبة" },
];
