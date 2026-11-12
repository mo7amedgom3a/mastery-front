"use client";

import { CircleAlert, CircleCheck, CircleDashed } from "lucide-react";

import { cn } from "@/lib/cn";

import type { Cause, CauseStatus } from "../../content/sales-failure/types";
import { LabPanel, Pill } from "../bits";

const labels: Record<CauseStatus, string> = {
  avoided: "نجوت منها",
  missed: "وقعت فيها",
  untested: "لم تُختبر",
};

const tone: Record<CauseStatus, string> = {
  avoided: "border-green bg-green/10",
  missed: "border-pink bg-pink/10",
  untested: "border-line",
};

const icons = { avoided: CircleCheck, missed: CircleAlert, untested: CircleDashed };

/** The debrief's map of the ten causes: what the learner avoided and what is still open. */
export function CausesChecklist({
  causes,
  statuses,
}: {
  causes: readonly Cause[];
  statuses: Record<Cause["id"], CauseStatus>;
}) {
  const avoided = causes.filter((cause) => statuses[cause.id] === "avoided").length;
  return (
    <LabPanel
      title="خريطة أسباب فشل المبيعات"
      subtitle="الدورة تعرض عشرة أسباب. هذه هي التي لمستها في هذا الأسبوع."
      action={<Pill>{avoided} / {causes.length} نجوت منها</Pill>}
    >
      <ul className="m-0 grid list-none gap-2 p-0 sm:grid-cols-2">
        {causes.map((cause) => {
          const status = statuses[cause.id];
          const Icon = icons[status];
          return (
            <li key={cause.id} className={cn("flex items-start gap-3 rounded-photo border p-3", tone[status])}>
              <Icon
                className={cn(
                  "mt-0.5 size-5 shrink-0",
                  status === "avoided" ? "text-green" : status === "missed" ? "text-pink" : "text-fg-muted",
                )}
                aria-hidden
              />
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="flex flex-wrap items-center gap-2 text-sm font-bold">
                  {cause.label}
                  <span className="rounded-chip bg-surface px-2 py-0.5 text-[11px] font-semibold text-fg-muted">
                    {labels[status]}
                  </span>
                </span>
                <span className="text-[13px] leading-5 text-fg-muted">{cause.text}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </LabPanel>
  );
}
