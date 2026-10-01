import type { Route } from "next";

import { routes } from "@/config/routes";

export type NavItem = { label: string; href: Route };

// Catalog links open the search page filtered to that product type.
export const primaryNav: readonly NavItem[] = [
  { label: "الدورات", href: routes.courses },
  { label: "الدبلومات", href: routes.diplomas },
  { label: "الباقات", href: routes.packages },
  { label: "الاستشارات", href: routes.consultations },
  { label: "للشركات", href: routes.business },
  { label: "للمدربين", href: routes.trainers },
];

/** The drawer has room for a search entry; the desktop bar shows it as an icon instead. */
export const mobileNav: readonly NavItem[] = [{ label: "البحث", href: routes.search }, ...primaryNav];
