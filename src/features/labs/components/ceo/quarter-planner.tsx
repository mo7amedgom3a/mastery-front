"use client";

import { Zap } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

import { QUARTER_BUDGET, allocationTotal, levers, quarterEvents, type Allocation, type Lever } from "../../model/market-sim";
import { LabPanel, OptionCard } from "../bits";

/** One quarter's decisions: split the budget across the levers and answer the quarter's event. */
export function QuarterPlanner({
  quarter,
  initial,
  onRun,
}: {
  quarter: number;
  initial: Allocation;
  onRun: (allocation: Allocation, eventChoice: string) => void;
}) {
  const [allocation, setAllocation] = useState<Allocation>(initial);
  const [choice, setChoice] = useState<string | null>(null);
  const event = quarterEvents.find((e) => e.quarter === quarter);
  const total = allocationTotal(allocation);
  const set = (lever: Lever, value: number) => setAllocation((a) => ({ ...a, [lever]: value }));

  return (
    <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
      <LabPanel
        title={`ميزانية الربع ${quarter}`}
        subtitle={`وزّع ${QUARTER_BUDGET} مليون ريال على الأدوات. المجموع يجب أن يساوي 100٪.`}
        action={
          <span
            dir="ltr"
            className={cn("rounded-chip px-2.5 py-1 text-sm font-bold tabular-nums", total === 100 ? "bg-green text-ink" : "bg-pink text-ink")}
          >
            {total}%
          </span>
        }
      >
        <div className="flex flex-col gap-4">
          {levers.map((lever) => (
            <label key={lever.id} className="flex flex-col gap-1.5">
              <span className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-semibold">{lever.label}</span>
                <span dir="ltr" className="text-sm font-bold tabular-nums">
                  {allocation[lever.id]}% · {((allocation[lever.id] / 100) * QUARTER_BUDGET).toFixed(1)}M
                </span>
              </span>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={allocation[lever.id]}
                onChange={(e) => set(lever.id, Number(e.target.value))}
                className="w-full accent-[var(--accent)]"
                aria-label={lever.label}
              />
              <span className="text-[12px] leading-5 text-fg-muted">{lever.hint}</span>
            </label>
          ))}
        </div>
      </LabPanel>
      <div className="flex min-w-0 flex-col gap-4">
        {event ? (
          <LabPanel
            title={
              <span className="inline-flex items-center gap-2">
                <Zap className="size-5 text-yellow" aria-hidden /> {event.title}
              </span>
            }
            subtitle={event.text}
          >
            <div role="radiogroup" className="flex flex-col gap-2">
              {event.choices.map((c) => (
                <OptionCard key={c.id} selected={choice === c.id} onSelect={() => setChoice(c.id)} title={c.label} detail={c.detail} />
              ))}
            </div>
          </LabPanel>
        ) : null}
        <Button size="lg" block disabled={total !== 100 || !choice} onClick={() => choice && onRun(allocation, choice)}>
          {total !== 100 ? `عدّل التوزيع (${total}٪)` : !choice ? "اختر قرارك في الحدث" : `شغّل الربع ${quarter}`}
        </Button>
      </div>
    </div>
  );
}
