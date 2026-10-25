"use client";

import { useQuery } from "@tanstack/react-query";
import {
  BriefcaseBusiness,
  CalendarClock,
  Gift,
  GraduationCap,
  Headset,
  Heart,
  House,
  Receipt,
  Repeat,
  WalletCards,
  Search,
  ShoppingCart,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import type { Route } from "next";
import { usePathname } from "next/navigation";

import { AppLink } from "@/components/ui/app-link";
import { routes } from "@/config/routes";
import { consultationQueries } from "@/lib/api/consultations";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";
import { useShopHydrated, useShopStore } from "@/lib/shop/store";

type StudentNavItem = {
  href: Route;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  count?: "wishlist" | "cart";
  /** Shown only to customers linked to a consultant. */
  expertOnly?: boolean;
};
type StudentNavGroup = { label: string; items: readonly StudentNavItem[] };

export const studentNavGroups: readonly StudentNavGroup[] = [
  {
    label: "التعلّم",
    items: [
      { href: routes.studentHome, label: "الرئيسية", icon: House, exact: true },
      { href: routes.studentAccess, label: "تعلّمي", icon: GraduationCap },
      { href: routes.studentConsultations, label: "استشاراتي", icon: CalendarClock },
      { href: routes.studentSubscription, label: "اشتراكي", icon: Repeat },
      { href: routes.search, label: "البحث", icon: Search },
    ],
  },
  {
    label: "التسوّق",
    items: [
      { href: routes.studentWishlist, label: "المفضلة", icon: Heart, count: "wishlist" },
      { href: routes.studentCart, label: "السلة", icon: ShoppingCart, count: "cart" },
      { href: routes.studentOrders, label: "الطلبات", icon: Receipt },
      { href: routes.studentVouchers, label: "قسائم الرصيد", icon: WalletCards },
      { href: routes.studentReferrals, label: "ادعُ صديقًا", icon: Gift },
    ],
  },
  {
    label: "الحساب",
    items: [
      { href: routes.studentProfile, label: "الملف الشخصي", icon: UserRound },
      { href: routes.studentSupport, label: "الدعم الفني", icon: Headset },
      { href: routes.expertDashboard, label: "لوحة الخبير", icon: BriefcaseBusiness, expertOnly: true },
    ],
  },
];

function isCurrent(pathname: string, item: StudentNavItem): boolean {
  return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

/**
 * The student area's navigation: a sticky sidebar in titled groups on large screens, one scrollable
 * row of pills below. Wishlist and cart show how many items they hold.
 */
export function StudentNav() {
  const pathname = usePathname();
  // Counts come from browser storage: none until it has been read, so server and client agree.
  const hydrated = useShopHydrated();
  const wishlist = useShopStore((state) => state.wishlist.length);
  const cart = useShopStore((state) => state.cart.length);
  const counts = { wishlist: hydrated ? wishlist : 0, cart: hydrated ? cart : 0 };
  const isExpert = useQuery(consultationQueries.expert()).isSuccess;

  return (
    <nav
      aria-label="حسابي"
      className="lg:sticky lg:top-[calc(var(--header-h)+1.5rem)] lg:rounded-panel lg:border lg:border-line lg:p-3"
    >
      <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:gap-4 lg:overflow-visible lg:pb-0">
        {studentNavGroups.map((group, groupIndex) => {
          const headingId = `student-nav-group-${groupIndex}`;
          return (
            <div
              key={group.label}
              className={cn("flex shrink-0 flex-col", groupIndex > 0 && "lg:border-t lg:border-line lg:pt-4")}
            >
              <p id={headingId} className="m-0 px-4 pb-2 text-xs font-bold text-fg-muted max-lg:hidden">
                {group.label}
              </p>
              <ul aria-labelledby={headingId} className="m-0 flex list-none gap-2 p-0 lg:flex-col lg:gap-1">
                {group.items.filter((item) => !item.expertOnly || isExpert).map((item) => {
                  const current = isCurrent(pathname, item);
                  const count = item.count ? counts[item.count] : 0;
                  const Icon = item.icon;
                  return (
                    <li key={item.href} className="shrink-0">
                      <AppLink
                        href={item.href}
                        aria-current={current ? "page" : undefined}
                        aria-label={count > 0 ? `${item.label} (${count})` : undefined}
                        className={cn(
                          "flex min-h-11 items-center gap-3 rounded-full px-4 font-medium whitespace-nowrap no-underline transition-colors lg:rounded-panel",
                          current ? "bg-fg text-surface" : "text-fg hover:bg-surface-alt",
                        )}
                      >
                        <Icon aria-hidden="true" className="size-5 shrink-0 fill-none" />
                        {item.label}
                        {count > 0 ? (
                          <span
                            aria-hidden="true"
                            className="ms-auto grid min-w-6 place-items-center rounded-full bg-accent px-1.5 text-xs leading-6 font-bold text-on-accent tabular-nums"
                          >
                            {formatNumber(count)}
                          </span>
                        ) : null}
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
