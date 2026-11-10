import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

type DashboardPanelProps = {
  /** Id placed on the H2, for the panel's `aria-labelledby`. */
  id: string;
  title: ReactNode;
  subtitle?: ReactNode;
  /** A "view all" link or small action at the end of the header row. */
  action?: ReactNode;
  className?: string;
  children: ReactNode;
};

/** A bordered dashboard panel with the demo's title/subtitle/action header. */
export function DashboardPanel({ id, title, subtitle, action, className, children }: DashboardPanelProps) {
  return (
    <section
      aria-labelledby={id}
      className={cn("flex min-w-0 flex-col rounded-panel border border-line bg-surface p-5 md:p-6", className)}
    >
      <header className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id={id} className="m-0 text-[17px] leading-7 font-bold">
              {title}
            </h2>
          </div>
          {subtitle ? <p className="m-0 text-[13px] leading-5 text-fg-muted">{subtitle}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </header>
      <div className="flex min-w-0 flex-1 flex-col gap-4">{children}</div>
    </section>
  );
}
