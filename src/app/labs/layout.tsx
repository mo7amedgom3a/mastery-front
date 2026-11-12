import type { Metadata } from "next";
import type { ReactNode } from "react";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { QueryProvider } from "@/components/providers/query-provider";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * Practice labs (demo): scripted simulations that run entirely in the browser, progress kept in
 * localStorage (only the course/diploma recommendations call the API). Public so stakeholders can try them without an account; not indexed.
 */
export default function LabsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="outline-none">
        {/* React Query: each lab recommends catalog courses and diplomas. */}
        <QueryProvider>{children}</QueryProvider>
      </main>
      <SiteFooter />
    </>
  );
}
