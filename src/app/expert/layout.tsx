import type { Metadata } from "next";
import type { ReactNode } from "react";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { QueryProvider } from "@/components/providers/query-provider";
import { ExpertGate } from "@/features/expert-dashboard/components/expert-gate";
import { ExpertNav } from "@/features/expert-dashboard/components/expert-nav";

export const metadata: Metadata = {
  title: { template: "%s | لوحة الخبير", default: "لوحة الخبير" },
  robots: { index: false, follow: false },
};

/**
 * The expert dashboard (`proxy.ts` sends guests to sign in first). Every page sits behind
 * `ExpertGate`, which shows a "not linked" state to customers who are not experts.
 */
export default function ExpertLayout({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="outline-none">
        <div className="ma-container flex flex-col gap-8 py-8 md:py-10 lg:grid lg:grid-cols-[16rem_minmax(0,1fr)] lg:items-start lg:gap-10">
          <ExpertNav />
          <div className="min-w-0">
            <ExpertGate>{children}</ExpertGate>
          </div>
        </div>
      </main>
      <SiteFooter />
    </QueryProvider>
  );
}
