import type { Metadata } from "next";
import type { ReactNode } from "react";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { QueryProvider } from "@/components/providers/query-provider";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * The signed-in student's own pages (`proxy.ts` sends guests to sign in first). The student
 * dashboard that will frame them comes later; for now they share the site chrome.
 */
export default function StudentLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="outline-none">
        <QueryProvider>{children}</QueryProvider>
      </main>
      <SiteFooter />
    </>
  );
}
