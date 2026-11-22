"use client";

import { createContext, useContext, type ReactNode } from "react";

/**
 * Which API lab/scenario a bespoke runner is playing.
 *
 * Bespoke runners still read their content from this repo by their own slug (e.g.
 * `deal-recovery-medical`). In live mode the server lab may differ (`deal-recovery`, scenario
 * `medical`), so the live page wraps the runner in this provider and `useLabSession` starts the
 * session on the API lab instead.
 */
export type LabRunTarget = {
  apiSlug: string;
  scenarioKey?: string;
  previewToken?: string;
  scorer?: "server" | "client";
};

const LabRunContext = createContext<LabRunTarget | null>(null);

export function LabRunProvider({ target, children }: { target: LabRunTarget; children: ReactNode }) {
  return <LabRunContext.Provider value={target}>{children}</LabRunContext.Provider>;
}

export function useLabRunTarget(): LabRunTarget | null {
  return useContext(LabRunContext);
}
