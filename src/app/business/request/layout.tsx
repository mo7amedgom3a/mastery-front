import type { Metadata } from "next";
import type { ReactNode } from "react";

import { QueryProvider } from "@/components/providers/query-provider";
import { RequestChrome } from "@/features/business-request/components/request-chrome";

export const metadata: Metadata = { title: "اطلب عرضاً تدريبياً لشركتك", robots: { index: false } };

/**
 * A focused frame for the company request: no site navigation, just the logo, the way back and the
 * progress bar. The layout stays mounted between steps, so the progress bar animates from step to step.
 */
export default function BusinessRequestLayout({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <RequestChrome />
      <main id="main" tabIndex={-1} className="outline-none">
        <div className="ma-container py-10 md:py-14">{children}</div>
      </main>
    </QueryProvider>
  );
}
