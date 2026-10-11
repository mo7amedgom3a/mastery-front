"use client";

import { GraduationCap, Heart, House, Receipt, Search, ShoppingCart, UserRound, type LucideIcon } from "lucide-react";
import type { Route } from "next";
import { usePathname } from "next/navigation";

import { AppLink } from "@/components/ui/app-link";
import { routes } from "@/config/routes";
import { cn } from "@/lib/cn";

type StudentNavItem = { href: Route; label: string; icon: LucideIcon; exact?: boolean };

export const studentNavItems: readonly StudentNavItem[] = [
  { href: routes.studentHome, label: "الرئيسية", icon: House, exact: true },
  { href: routes.studentAccess, label: "تعلّمي", icon: GraduationCap },
  { href: routes.search, label: "البحث", icon: Search },
  { href: routes.wishlist, label: "المفضلة", icon: Heart },
  { href: routes.cart, label: "السلة", icon: ShoppingCart },
  { href: routes.studentOrders, label: "الطلبات", icon: Receipt },
  { href: routes.studentProfile, label: "الملف الشخصي", icon: UserRound },
];

function isCurrent(pathname: string, item: StudentNavItem): boolean {
  return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

/** The student area's navigation: a sticky sidebar on large screens, a scrollable tab row below. */
export function StudentNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="حسابي" className="lg:sticky lg:top-[calc(var(--header-h)+1.5rem)]">
      <ul className="m-0 flex list-none gap-2 overflow-x-auto p-0 pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
        {studentNavItems.map((item) => {
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
    </nav>
  );
}
