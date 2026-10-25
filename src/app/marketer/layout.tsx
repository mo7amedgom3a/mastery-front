import type { Metadata } from "next";
import type { ReactNode } from "react";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { QueryProvider } from "@/components/providers/query-provider";
import { MarketerGate } from "@/features/marketer-dashboard/components/marketer-gate";
import { MarketerNav } from "@/features/marketer-dashboard/components/marketer-nav";

export const metadata: Metadata = {
  title: { template: "%s | لوحة المسوّق", default: "لوحة المسوّق" },
  robots: { index: false, follow: false },
};

/**
 * The marketer dashboard (`proxy.ts` sends guests to sign in first). Every page sits behind
 * `MarketerGate`, which shows a "not a marketer" or "under review" state to everyone else.
 */
export default function MarketerLayout({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="outline-none">
        <div className="ma-container flex flex-col gap-8 py-8 md:py-10 lg:grid lg:grid-cols-[16rem_minmax(0,1fr)] lg:items-start lg:gap-10">
          <MarketerNav />
          <div className="min-w-0">
            <MarketerGate>{children}</MarketerGate>
          </div>
        </div>
      </main>
      <SiteFooter />
    </QueryProvider>
  );
}
