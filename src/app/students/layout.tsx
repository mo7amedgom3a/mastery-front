import type { Metadata } from "next";
import type { ReactNode } from "react";

import { QueryProvider } from "@/components/providers/query-provider";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * The signed-in student's own pages (`proxy.ts` sends guests to sign in first). The dashboard pages
 * and the onboarding flow each bring their own chrome; both need the data client.
 */
export default function StudentLayout({ children }: { children: ReactNode }) {
  return <QueryProvider>{children}</QueryProvider>;
}
