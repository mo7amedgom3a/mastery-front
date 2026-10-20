"use client";

import { ChevronDown } from "lucide-react";

import { AppLink } from "@/components/ui/app-link";

import type { MenuGroupVM } from "../model/types";

const summaryClass =
  "flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden";

/** The drawer's explore section: group → categories, no hover panels on touch. */
export function MobileExploreMenu({ groups, popoverId }: { groups: MenuGroupVM[]; popoverId: string }) {
  const close = () => document.getElementById(popoverId)?.hidePopover();

  return (
    <details className="group border-b border-line">
      <summary className={`${summaryClass} min-h-16`}>
        <span className="text-2xl font-bold text-fg">استكشف</span>
        <ChevronDown aria-hidden="true" className="size-5 text-fg-muted transition-transform group-open:rotate-180" />
      </summary>
      <div className="flex flex-col gap-1 pb-3 ps-3">
        {groups.map((group) => (
          <details key={group.type} className="group/group">
            <summary className={`${summaryClass} min-h-12`}>
              <span className="text-lg font-semibold text-fg">{group.label}</span>
              <span className="flex items-center gap-2 text-sm font-normal text-fg-muted">
                {group.count}
                <ChevronDown
                  aria-hidden="true"
                  className="size-4 transition-transform group-open/group:rotate-180"
                />
              </span>
            </summary>
            <div className="flex flex-col gap-0.5 pb-2 ps-3">
              <AppLink href={group.href} onClick={close} className="flex min-h-11 items-center text-sm text-fg-muted no-underline">
                كل {group.label}
              </AppLink>
              {group.categories.map((category) => (
                <AppLink
                  key={category.id}
                  href={category.href}
                  onClick={close}
                  className="flex min-h-11 items-center justify-between gap-3 text-sm text-fg-muted no-underline"
                >
                  <span>{category.name}</span>
                  <span className="text-xs tabular-nums">{category.count}</span>
                </AppLink>
              ))}
            </div>
          </details>
        ))}
      </div>
    </details>
  );
}
