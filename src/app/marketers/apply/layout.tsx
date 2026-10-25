import type { Metadata } from "next";
import type { ReactNode } from "react";

import { QueryProvider } from "@/components/providers/query-provider";
import { ApplyChrome } from "@/features/marketer-application/components/apply-chrome";

export const metadata: Metadata = { title: "انضم لبرنامج المسوقين", robots: { index: false } };

/**
 * A focused frame for the marketer application: no site navigation, just the logo, the way back and
 * the progress bar. The layout stays mounted between steps, so the progress bar animates between them.
 */
export default function MarketerApplyLayout({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <ApplyChrome />
      <main id="main" tabIndex={-1} className="outline-none">
        <div className="ma-container py-10 md:py-14">{children}</div>
      </main>
    </QueryProvider>
  );
}
