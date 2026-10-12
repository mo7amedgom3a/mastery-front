"use client";

import {
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  MessagesSquare,
  Settings,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import type { Route } from "next";
import { usePathname } from "next/navigation";

import { AppLink } from "@/components/ui/app-link";
import { routes } from "@/config/routes";
import { cn } from "@/lib/cn";

type ExpertNavItem = { href: Route; label: string; icon: LucideIcon; exact?: boolean };
type ExpertNavGroup = { label: string; items: readonly ExpertNavItem[] };

const groups: readonly ExpertNavGroup[] = [
  {
    label: "لوحة الخبير",
    items: [
      { href: routes.expertDashboard, label: "نظرة عامة", icon: LayoutDashboard, exact: true },
      { href: routes.expertBookings, label: "الحجوزات", icon: ClipboardList },
      { href: routes.expertCalendar, label: "التقويم", icon: CalendarDays },
      { href: routes.expertServices, label: "استشاراتي المعروضة", icon: MessagesSquare },
    ],
  },
  {
    label: "الحساب",
    items: [
      { href: routes.expertSettings, label: "الإعدادات", icon: Settings },
      { href: routes.studentHome, label: "حساب الطالب", icon: UserRound, exact: true },
    ],
  },
];

function isCurrent(pathname: string, item: ExpertNavItem): boolean {
  return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

/** The expert dashboard's navigation: a sticky sidebar on large screens, one scrollable row below. */
export function ExpertNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="لوحة الخبير"
      className="lg:sticky lg:top-[calc(var(--header-h)+1.5rem)] lg:rounded-panel lg:border lg:border-line lg:p-3"
    >
      <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:gap-4 lg:overflow-visible lg:pb-0">
        {groups.map((group, groupIndex) => {
          const headingId = `expert-nav-group-${groupIndex}`;
          return (
            <div
              key={group.label}
              className={cn("flex shrink-0 flex-col", groupIndex > 0 && "lg:border-t lg:border-line lg:pt-4")}
            >
              <p id={headingId} className="m-0 px-4 pb-2 text-xs font-bold text-fg-muted max-lg:hidden">
                {group.label}
              </p>
              <ul aria-labelledby={headingId} className="m-0 flex list-none gap-2 p-0 lg:flex-col lg:gap-1">
                {group.items.map((item) => {
                  const current = isCurrent(pathname, item);
                  const Icon = item.icon;
                  return (
                    <li key={item.href} className="shrink-0">
                      <AppLink
                        href={item.href}
                        aria-current={current ? "page" : undefined}
                        className={cn(
                          "flex min-h-11 items-center gap-3 rounded-full px-4 font-medium whitespace-nowrap no-underline transition-colors lg:rounded-panel",
                          current ? "bg-fg text-surface" : "text-fg hover:bg-surface-alt",
                        )}
                      >
                        <Icon aria-hidden="true" className="size-5 shrink-0 fill-none" />
                        {item.label}
                      </AppLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </nav>
  );
}
