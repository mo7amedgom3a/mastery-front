"use client";

import { Clock, UserRound } from "lucide-react";

import { cn } from "@/lib/cn";

import { sar } from "../documents/doc-types";
import type { DealHealth, PipelineDeal, PipelineStage } from "./crm-types";

const healthDot: Record<DealHealth, string> = { good: "bg-green", warn: "bg-yellow", bad: "bg-pink" };
const healthLabel: Record<DealHealth, string> = { good: "سليمة", warn: "تحتاج متابعة", bad: "في خطر" };

/** A kanban pipeline: one column per stage, deal cards with value, owner, age and health. */
export function PipelineBoard({
  stages,
  deals,
  focusId,
  onOpen,
}: {
  stages: readonly PipelineStage[];
  deals: readonly PipelineDeal[];
  focusId?: string;
  onOpen?: (id: string) => void;
}) {
  return (
    <div className="-mx-1 overflow-x-auto px-1 pb-2" role="region" aria-label="مسار الصفقات" tabIndex={0}>
      <div className="grid min-w-[880px] grid-cols-5 gap-3">
        {stages.map((stage) => {
          const items = deals.filter((deal) => deal.stage === stage.id);
          const sum = items.reduce((total, deal) => total + deal.value, 0);
          return (
            <section key={stage.id} className="flex min-w-0 flex-col gap-2 rounded-photo bg-surface-alt/60 p-2">
              <header className="flex items-baseline justify-between gap-2 px-1">
                <h3 className={cn("m-0 text-[13px] font-bold", stage.id === "stalled" && "text-pink")}>{stage.label}</h3>
                <span className="text-[11px] text-fg-muted tabular-nums">{items.length}</span>
              </header>
              <span dir="ltr" className="px-1 text-end text-[11px] text-fg-muted tabular-nums">
                {sar(sum)}
              </span>
              {items.map((deal) => {
                const focus = deal.id === focusId;
                const card = (
                  <>
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-[13px] font-bold">{deal.company}</span>
                      <span className={cn("size-2.5 shrink-0 rounded-full", healthDot[deal.health])} title={healthLabel[deal.health]} />
                    </span>
                    <span className="line-clamp-2 text-[12px] leading-5 text-fg-muted">{deal.title}</span>
                    <span dir="ltr" className="text-end text-[13px] font-semibold tabular-nums">
                      {sar(deal.value)}
                    </span>
                    <span className="flex items-center justify-between gap-2 text-[11px] text-fg-muted">
                      <span className="inline-flex items-center gap-1 truncate">
                        <UserRound className="size-3" aria-hidden /> {deal.owner}
                      </span>
                      <span className="inline-flex shrink-0 items-center gap-1">
                        <Clock className="size-3" aria-hidden /> {deal.ageDays} يوم
                      </span>
                    </span>
                  </>
                );
                const classes = cn(
                  "flex flex-col gap-1.5 rounded-photo border bg-surface p-2.5 text-start",
                  focus ? "border-pink ring-2 ring-pink/40" : "border-line",
                );
                return focus && onOpen ? (
                  <button key={deal.id} type="button" onClick={() => onOpen(deal.id)} className={cn(classes, "hover:bg-pink/5")}>
                    {card}
                    <span className="mt-1 rounded-chip bg-pink px-2 py-0.5 text-center text-[11px] font-bold text-ink">صفقتك · افتح الملف</span>
                  </button>
                ) : (
                  <article key={deal.id} className={cn(classes, !focus && "opacity-80")}>
                    {card}
                  </article>
                );
              })}
            </section>
          );
        })}
      </div>
    </div>
  );
}
