"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { AnnouncementBar } from "@/lib/api/announcements";

/**
 * The live bars, fetched once in the root layout. A context (not a fetch inside `SiteHeader`) keeps
 * the header importable from client components; without a provider (admin previews) there is no bar.
 */
const AnnouncementsContext = createContext<readonly AnnouncementBar[]>([]);

export function AnnouncementsProvider({ bars, children }: { bars: readonly AnnouncementBar[]; children: ReactNode }) {
  return <AnnouncementsContext.Provider value={bars}>{children}</AnnouncementsContext.Provider>;
}

export function useAnnouncementBars(): readonly AnnouncementBar[] {
  return useContext(AnnouncementsContext);
}
