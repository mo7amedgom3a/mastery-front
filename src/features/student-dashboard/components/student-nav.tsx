"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Award,
  Bell,
  BriefcaseBusiness,
  CalendarClock,
  CalendarDays,
  ChartPie,
  ClipboardCheck,
  FlaskConical,
  Gift,
  GraduationCap,
  Headset,
  Heart,
  House,
  Receipt,
  Repeat,
  Search,
  ShoppingCart,
  TrendingUp,
  UserRound,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import type { Route } from "next";
import { usePathname } from "next/navigation";

import { AppLink } from "@/components/ui/app-link";
import { routes } from "@/config/routes";
import { useNotificationsStore } from "@/features/notifications/use-notifications";
import { commerceQueries } from "@/lib/api/commerce";
import { consultationQueries } from "@/lib/api/consultations";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";
import { useShopHydrated, useShopStore } from "@/lib/shop/store";

type StudentNavItem = {
  href: Route;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  count?: "wishlist" | "cart" | "learning" | "notifications";
  /** Muted count pill (learning, wishlist) rather than the accent one. */
  quiet?: boolean;
  /** Shown only to customers linked to a consultant. */
  expertOnly?: boolean;
};
type StudentNavGroup = { label: string; items: readonly StudentNavItem[] };

export const studentNavGroups: readonly StudentNavGroup[] = [
  {
    label: "التعلّم",
    items: [
      { href: routes.studentHome, label: "الرئيسية", icon: House, exact: true },
      { href: routes.studentAccess, label: "تعلّمي", icon: GraduationCap, count: "learning", quiet: true },
      { href: routes.studentPlanner(), label: "خطة التعلّم", icon: CalendarDays },
      { href: routes.studentExams, label: "اختباراتي", icon: ClipboardCheck },
      { href: routes.labs, label: "المختبرات العملية", icon: FlaskConical },
      { href: routes.studentProgress, label: "تقدّم التعلّم", icon: TrendingUp },
      { href: routes.studentInsights, label: "رؤى التعلّم", icon: ChartPie },
      { href: routes.studentCertificates, label: "شهاداتي", icon: Award },
      { href: routes.studentConsultations, label: "استشاراتي", icon: CalendarClock },
      { href: routes.search, label: "البحث", icon: Search },
    ],
  },
  {
    label: "المشتريات والرصيد",
    items: [
      { href: routes.studentCart, label: "السلة", icon: ShoppingCart, count: "cart" },
      { href: routes.studentWishlist, label: "المفضلة", icon: Heart, count: "wishlist", quiet: true },
      { href: routes.studentOrders, label: "طلباتي", icon: Receipt },
      { href: routes.studentVouchers, label: "قسائم الرصيد", icon: WalletCards },
      { href: routes.studentReferrals, label: "ادعُ صديقًا", icon: Gift },
    ],
  },
  {
    label: "الحساب",
    items: [
      { href: routes.studentSubscription, label: "اشتراكي", icon: Repeat },
      { href: routes.studentNotifications, label: "الإشعارات", icon: Bell, count: "notifications" },
      { href: routes.studentProfile, label: "الملف الشخصي", icon: UserRound },
      { href: routes.studentSupport, label: "الدعم الفني", icon: Headset },
      { href: routes.expertDashboard, label: "لوحة الخبير", icon: BriefcaseBusiness, expertOnly: true },
    ],
  },
];

function isCurrent(pathname: string, item: StudentNavItem): boolean {
  return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

/** The nav label for the current page, for the dashboard topbar breadcrumb. */
export function studentNavLabel(pathname: string): string {
  for (const group of studentNavGroups) {
    for (const item of group.items) {
      if (!item.expertOnly && isCurrent(pathname, item)) return item.label;
    }
  }
  return "لوحتي";
}

/**
 * The demo sidebar's nav: titled groups of flat links, an accent pill for the current page and
 * counts for programs, cart, wishlist and unread notifications. Rendered inside the shell's
 * scrollable region; the plan card lives in the shell footer.
 */
export function StudentNav({ onNavigate }: { onNavigate?: () => void } = {}) {
  const pathname = usePathname();
  // Counts come from browser storage: none until it has been read, so server and client agree.
  const hydrated = useShopHydrated();
  const wishlist = useShopStore((state) => state.wishlist.length);
  const cart = useShopStore((state) => state.cart.length);
  const owned = useQuery(commerceQueries.ownedProducts({ status: "active", limit: 100 }));
  const learningCount = (owned.data?.items ?? []).filter((product) => product.product_type !== "consultation").length;
  const unread = useNotificationsStore((state) => state.unread);
  const counts = {
    wishlist: hydrated ? wishlist : 0,
    cart: hydrated ? cart : 0,
    learning: learningCount,
    notifications: unread,
  };
  const isExpert = useQuery(consultationQueries.expertCapability()).data?.is_expert === true;

  return (
    <nav aria-label="حسابي" className="flex flex-col gap-4">
      {studentNavGroups.map((group, groupIndex) => {
        const headingId = `student-nav-group-${groupIndex}`;
        return (
          <div
            key={group.label}
            className={cn("flex flex-col gap-1", groupIndex > 0 && "border-t border-line pt-4")}
          >
            <h2 id={headingId} className="m-0 px-3 pb-1.5 text-xs leading-5 font-semibold text-fg-muted">
              {group.label}
            </h2>
            <ul aria-labelledby={headingId} className="m-0 flex list-none flex-col gap-0.5 p-0">
              {group.items.filter((item) => !item.expertOnly || isExpert).map((item) => {
                const current = isCurrent(pathname, item);
                const count = item.count ? counts[item.count] : 0;
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <AppLink
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={current ? "page" : undefined}
                      aria-label={count > 0 ? `${item.label} (${formatNumber(count)})` : undefined}
                      className={cn(
                        "flex min-h-[42px] items-center gap-3 rounded-ctl px-3 text-[15px] font-medium whitespace-nowrap no-underline transition-colors",
                        current ? "bg-fg text-surface" : "text-fg-muted hover:bg-surface hover:text-fg",
                      )}
                    >
                      <Icon
                        aria-hidden="true"
                        className={cn("size-5 shrink-0 fill-none", current ? "text-accent" : "text-current")}
                      />
                      {item.label}
                      {count > 0 ? (
                        <span
                          aria-hidden="true"
                          className={cn(
                            "ms-auto grid min-w-6 place-items-center rounded-full px-1.5 text-xs leading-6 font-bold tabular-nums",
                            item.quiet
                              ? current
                                ? "bg-surface/20 text-surface"
                                : "bg-surface-alt text-fg"
                              : "bg-accent text-on-accent",
                          )}
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
    </nav>
  );
}
