import type { ReactNode } from "react";

import { QueryProvider } from "@/components/providers/query-provider";

/**
 * The search page's typeahead is its only per-visitor browser read, so React Query is scoped
 * to this route instead of the root layout (static pages must not ship it).
 */
export default function SearchLayout({ children }: { children: ReactNode }) {
  return <QueryProvider>{children}</QueryProvider>;
}
