import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export type DashboardStat = {
  label: string;
  value: ReactNode;
  hint?: string;
};

/** The demo's 2×2 stat block: one hairline grid, one tile per figure. */
export function StatGrid({
  stats,
  className,
  columns = 2,
}: {
  stats: readonly DashboardStat[];
  className?: string;
  /** Two tiles per row inside a narrow rail, four across on a full-width page. */
  columns?: 2 | 4;
}) {
  return (
    <ul
      className={cn(
        "m-0 grid list-none gap-px overflow-hidden rounded-photo bg-line p-0",
        columns === 4 ? "grid-cols-2 md:grid-cols-4" : "grid-cols-2",
        className,
      )}
    >
      {stats.map((stat) => (
        <li key={stat.label} className="flex min-w-0 flex-col gap-0.5 bg-surface p-4">
          <span className="text-2xl leading-tight font-bold tabular-nums">{stat.value}</span>
          <span className="text-[13px] leading-5 text-fg-muted">{stat.label}</span>
          {stat.hint ? <span className="text-xs text-fg-muted">{stat.hint}</span> : null}
        </li>
      ))}
    </ul>
  );
}
