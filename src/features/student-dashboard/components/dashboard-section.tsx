import type { LucideIcon } from "lucide-react";
import type { Route } from "next";
import type { ReactNode } from "react";

import { ViewAllLink } from "@/components/ui/view-all-link";

type DashboardSectionProps = {
  id: string;
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  viewAll?: { href: Route; label?: string };
  children: ReactNode;
};

/** A dashboard block: icon, title and subtitle, an optional "view all", then its content. */
export function DashboardSection({ id, icon: Icon, title, subtitle, viewAll, children }: DashboardSectionProps) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-panel bg-surface-alt">
            <Icon className="size-5 fill-none text-accent" />
          </span>
          <div className="flex min-w-0 flex-col">
            <h2 id={id} className="m-0 text-xl leading-8 font-bold">
              {title}
            </h2>
            {subtitle ? <p className="m-0 text-sm text-fg-muted">{subtitle}</p> : null}
          </div>
        </div>
        {viewAll ? <ViewAllLink href={viewAll.href} label={viewAll.label ?? "عرض الكل"} /> : null}
      </header>
      {children}
    </section>
  );
}
