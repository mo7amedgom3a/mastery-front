import type { Route } from "next";

import { routes } from "@/config/routes";

export type NavItem = { label: string; href: Route };

// In-page anchors for now; switch each to its listing route when that page ships.
export const primaryNav: readonly NavItem[] = [
  { label: "الدورات", href: routes.section("courses") },
  { label: "الدبلومات", href: routes.section("diplomas") },
  { label: "الباقات", href: routes.section("packages") },
  { label: "الاستشارات", href: routes.section("consultations") },
  { label: "للشركات", href: routes.section("business") },
];
