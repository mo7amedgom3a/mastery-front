import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Route } from "next";
import type { ComponentType, ReactNode } from "react";

import { AppLink } from "@/components/ui/app-link";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";

type PageLinkProps = {
  href: Route;
  className?: string;
  rel?: string;
  "aria-label"?: string;
  "aria-current"?: "page";
  children: ReactNode;
};

type PaginationProps = {
  /** 1-based current page. */
  page: number;
  pageCount: number;
  hrefFor: (page: number) => Route;
  /** Accessible name of the landmark, e.g. "صفحات النتائج". */
  label: string;
  /** Link component, for lists that navigate their own way. Defaults to `AppLink`. */
  link?: ComponentType<PageLinkProps>;
  className?: string;
};

/** Pages to show: first, last, the current one and its neighbours; `null` marks a gap. */
export function pageWindow(page: number, pageCount: number): (number | null)[] {
  const wanted = new Set([1, pageCount, page - 1, page, page + 1]);
  // Never leave a gap that hides a single page: show the page instead of "…".
  if (page - 2 === 2) wanted.add(2);
  if (page + 2 === pageCount - 1) wanted.add(pageCount - 1);
  const pages = [...wanted].filter((item) => item >= 1 && item <= pageCount).toSorted((a, b) => a - b);

  const items: (number | null)[] = [];
  for (const [index, item] of pages.entries()) {
    if (index > 0 && item - pages[index - 1] > 1) items.push(null);
    items.push(item);
  }
  return items;
}

const cell = "min-w-11 min-h-11 px-3 tabular-nums";

/**
 * Numbered page links with previous/next. Real links, so every page is reachable without
 * JavaScript and by crawlers. Renders nothing for a single page.
 */
export function Pagination({ page, pageCount, hrefFor, label, link: PageLink = AppLink, className }: PaginationProps) {
  if (pageCount <= 1) {
    return null;
  }
  return (
    <nav aria-label={label} className={className}>
      <ul className="m-0 flex list-none flex-wrap items-center gap-2 p-0">
        {page > 1 ? (
          <li>
            <PageLink
              href={hrefFor(page - 1)}
              rel="prev"
              className={cn(buttonClass({ variant: "outline", size: "sm" }), cell)}
            >
              {/* RTL: "previous" points right. */}
              <ArrowRight aria-hidden="true" className="size-4 fill-none" />
              السابق
            </PageLink>
          </li>
        ) : null}
        {pageWindow(page, pageCount).map((item, index) =>
          item === null ? (
            // A gap always sits between two numbers, so the one before it names it uniquely.
            <li key={`gap-${index}`} aria-hidden="true" className="px-1 text-fg-muted">
              …
            </li>
          ) : (
            // Phones keep first, current and last; the neighbours are one tap away via previous/next.
            <li key={item} className={cn(item !== page && item !== 1 && item !== pageCount && "max-sm:hidden")}>
              <PageLink
                href={hrefFor(item)}
                aria-label={`الصفحة ${item}`}
                aria-current={item === page ? "page" : undefined}
                className={cn(buttonClass({ variant: item === page ? "secondary" : "outline", size: "sm" }), cell)}
              >
                {formatNumber(item)}
              </PageLink>
            </li>
          ),
        )}
        {page < pageCount ? (
          <li>
            <PageLink
              href={hrefFor(page + 1)}
              rel="next"
              className={cn(buttonClass({ variant: "outline", size: "sm" }), cell)}
            >
              التالي
              <ArrowLeft aria-hidden="true" className="size-4 fill-none" />
            </PageLink>
          </li>
        ) : null}
      </ul>
    </nav>
  );
}
