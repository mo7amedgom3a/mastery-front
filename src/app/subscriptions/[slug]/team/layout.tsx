import type { Metadata } from "next";

import { QueryProvider } from "@/components/providers/query-provider";
import { TeamChrome } from "@/features/subscriptions/team/team-chrome";

export const metadata: Metadata = { title: "اشتراك فريقك", robots: { index: false } };

/**
 * A focused frame for a company subscription: no site navigation, just the business logo, the way back
 * and the progress bar. It stays mounted between steps, so the progress bar animates from step to step.
 */
export default async function TeamCheckoutLayout({ children, params }: LayoutProps<"/subscriptions/[slug]/team">) {
  const { slug } = await params;
  return (
    <QueryProvider>
      <TeamChrome slug={slug} />
      <main id="main" tabIndex={-1} className="outline-none">
        <div className="ma-container py-10 md:py-14">{children}</div>
      </main>
    </QueryProvider>
  );
}
