import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

/** The quiet empty state every insights panel uses: one line of text and an optional action. */
export function PanelEmpty({ children, action, className }: { children: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "flex min-h-32 flex-col items-center justify-center gap-3 rounded-photo border border-dashed border-line p-5 text-center",
        className,
      )}
    >
      <p className="m-0 max-w-[46ch] text-sm leading-6 text-fg-muted">{children}</p>
      {action}
    </div>
  );
}

/** Screen-reader summary for a chart: the visible SVG is decorative, this carries the facts. */
export function ChartSummary({ children }: { children: ReactNode }) {
  return <p className="sr-only">{children}</p>;
}
