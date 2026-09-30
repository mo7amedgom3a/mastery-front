import type { ReactNode } from "react";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { QueryProvider } from "@/components/providers/query-provider";

/**
 * Wishlist, cart and checkout: pages about this visitor, rendered from what their browser holds.
 * They share the site chrome and the data client, which no other page needs.
 */
export default function ShopLayout({ children }: { children: ReactNode }) {
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
