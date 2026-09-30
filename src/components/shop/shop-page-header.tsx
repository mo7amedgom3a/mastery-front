import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";

import { AppLink } from "@/components/ui/app-link";
import { routes } from "@/config/routes";

type ShopPageHeaderProps = {
  /** Id placed on the H1, for the page's `aria-labelledby`. */
  id: string;
  title: string;
  /** Breadcrumb label when it differs from the title. */
  crumb?: string;
  lead?: ReactNode;
};

/** Page header for the wishlist, cart and checkout pages: breadcrumb and H1 on the alt surface. */
export function ShopPageHeader({ id, title, crumb, lead }: ShopPageHeaderProps) {
  return (
    <section aria-labelledby={id} className="border-b border-line bg-surface-alt text-fg">
      <div className="ma-container pt-8 pb-8 md:pt-12 md:pb-10">
        <nav aria-label="مسار التصفح">
          <ol className="m-0 flex list-none flex-wrap items-center gap-1 p-0 text-sm text-fg-muted">
            <li>
              <AppLink href={routes.home} className="text-fg-muted no-underline hover:text-fg">
                الرئيسية
              </AppLink>
            </li>
            <li aria-hidden="true">
              <ChevronLeft className="size-4" />
            </li>
            <li aria-current="page" className="text-fg">
              {crumb ?? title}
            </li>
          </ol>
        </nav>
        <h1 id={id} className="t-section m-0 mt-6 break-words md:mt-8">
          {title}
        </h1>
        {lead ? <p className="t-lead m-0 mt-4 max-w-[60ch]">{lead}</p> : null}
      </div>
    </section>
  );
}
