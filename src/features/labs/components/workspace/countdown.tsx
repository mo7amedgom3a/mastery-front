"use client";

import { Hourglass } from "lucide-react";

import { cn } from "@/lib/cn";

/** A big simulated-time countdown (minutes left in the room, hours left in the window). */
export function Countdown({ value, total, unit, label }: { value: number; total: number; unit: string; label: string }) {
  const left = Math.max(0, value);
  const ratio = total ? left / total : 0;
  return (
    <div
      role="timer"
      aria-label={`${label}: ${left} ${unit}`}
      className={cn(
        "flex items-center gap-3 rounded-panel border p-3",
        ratio <= 0.2 ? "border-pink bg-pink/10" : ratio <= 0.5 ? "border-yellow bg-yellow/10" : "border-line bg-surface",
      )}
    >
      <Hourglass className={cn("size-6 shrink-0", ratio <= 0.2 ? "text-pink" : "text-fg-muted")} aria-hidden />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[13px] text-fg-muted">{label}</span>
          <span className="text-xl font-bold tabular-nums">
            {left} <span className="text-[13px] font-normal text-fg-muted">{unit}</span>
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-line">
          <div
            className={cn("h-full rounded-full transition-[width] duration-500", ratio <= 0.2 ? "bg-pink" : ratio <= 0.5 ? "bg-yellow" : "bg-green")}
            style={{ width: `${Math.round(ratio * 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
