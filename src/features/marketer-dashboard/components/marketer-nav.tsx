"use client";

import {
  Banknote,
  LayoutDashboard,
  Percent,
  ReceiptText,
  TicketPercent,
  UserRound,
  UserRoundCog,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { Route } from "next";
import { usePathname } from "next/navigation";

import { AppLink } from "@/components/ui/app-link";
import { routes } from "@/config/routes";
import { cn } from "@/lib/cn";

type NavItem = { href: Route; label: string; icon: LucideIcon; exact?: boolean };
type NavGroup = { label: string; items: readonly NavItem[] };

const groups: readonly NavGroup[] = [
  {
    label: "لوحة المسوّق",
    items: [
      { href: routes.marketerDashboard, label: "نظرة عامة", icon: LayoutDashboard, exact: true },
      { href: routes.marketerCustomers, label: "العملاء", icon: Users },
      { href: routes.marketerSales, label: "المبيعات", icon: ReceiptText },
      { href: routes.marketerCommissions, label: "العمولات", icon: Percent },
      { href: routes.marketerCoupons, label: "الكوبونات", icon: TicketPercent },
      { href: routes.marketerPayouts, label: "الرصيد والصرف", icon: Banknote },
    ],
  },
  {
    label: "الحساب",
    items: [
      { href: routes.marketerProfile, label: "بياناتي", icon: UserRoundCog },
      { href: routes.studentHome, label: "حساب الطالب", icon: UserRound, exact: true },
    ],
  },
];

function isCurrent(pathname: string, item: NavItem): boolean {
  return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

/** The marketer dashboard's navigation: a sticky sidebar on large screens, one scrollable row below. */
export function MarketerNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="لوحة المسوّق"
      className="lg:sticky lg:top-[calc(var(--header-h)+1.5rem)] lg:rounded-panel lg:border lg:border-line lg:p-3"
    >
      <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:gap-4 lg:overflow-visible lg:pb-0">
        {groups.map((group, groupIndex) => {
          const headingId = `marketer-nav-group-${groupIndex}`;
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
