import type { Route } from "next";

import { routes } from "@/config/routes";

export type NavItem = {
  label: string;
  href: Route;
  /** Shown in the desktop bar from 1280px only (the bar has no room below); always in the drawer. */
  wideOnly?: boolean;
};

// The explore menu groups every catalog type; the bar keeps only the main listing and the
// non-catalog links.
export const primaryNav: readonly NavItem[] = [
  { label: "الدورات", href: routes.courses },
  { label: "المدربون", href: routes.experts },
  { label: "الاشتراكات", href: routes.subscriptions },
  { label: "للشركات", href: routes.business },
  { label: "للمدربين", href: routes.trainers },
  { label: "للمسوقين", href: routes.marketers, wideOnly: true },
];

/** The drawer has room for a search entry; the desktop bar shows it as an icon instead. */
export const mobileNav: readonly NavItem[] = [{ label: "البحث", href: routes.search }, ...primaryNav];
