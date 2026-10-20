"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { ExploreMenuVM } from "../model/types";

/**
 * The header menu's data, fetched once in the root layout and shared by the desktop and mobile
 * menus. A context keeps `SiteHeader` usable from client components (admin previews).
 */
const ExploreMenuContext = createContext<ExploreMenuVM | null>(null);

export function ExploreMenuProvider({ menu, children }: { menu: ExploreMenuVM | null; children: ReactNode }) {
  return <ExploreMenuContext.Provider value={menu}>{children}</ExploreMenuContext.Provider>;
}

export function useExploreMenu(): ExploreMenuVM | null {
  return useContext(ExploreMenuContext);
}
