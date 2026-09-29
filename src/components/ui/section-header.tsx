import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

type SectionHeaderProps = {
  /** Id placed on the heading so the section can use `aria-labelledby`. */
  id: string;
  /** Running header shown above the rule, e.g. "الدورات". */
  label: string;
  /** Running header counter, e.g. "03". */
  index?: string;
  title: ReactNode;
  lead?: ReactNode;
  /** Trailing action (e.g. "عرض الكل") aligned to the inline end of the title row. */
  action?: ReactNode;
  className?: string;
};

/** Kit `.ma-sechead`: full-width rule + running header, then the section title with a coral accent. */
export function SectionHeader({ id, label, index, title, lead, action, className }: SectionHeaderProps) {
  return (
    <header className={cn("ma-sechead", className)}>
      <div className="ma-sechead__run pt-3">
        <span>{label}</span>
        {index ? <span aria-hidden="true">{index}</span> : null}
      </div>
      <div className="mt-10 flex flex-wrap items-end justify-between gap-x-8 gap-y-6 md:mt-12">
        <h2 id={id} className="ma-sechead__title t-section mt-0 max-w-[22ch]">
          {title}
        </h2>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {lead ? <p className="ma-sechead__lead t-lead mt-6 md:mt-8">{lead}</p> : null}
    </header>
  );
}
