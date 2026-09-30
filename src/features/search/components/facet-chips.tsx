import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";

import type { FacetGroupVM, FacetOptionVM } from "../model/types";
import { FilterLink } from "./search-nav";

function Chip({ option, showCount }: { option: FacetOptionVM; showCount: boolean }) {
  return (
    <FilterLink
      href={option.href}
      aria-current={option.selected ? "true" : undefined}
      // Finer filter combinations are not worth a crawler's time; the listings themselves are.
      rel={option.indexable ? undefined : "nofollow"}
      className={cn(
        buttonClass({ variant: option.selected ? "secondary" : "outline", size: "sm" }),
        "max-md:min-h-11",
      )}
    >
      {option.label}
      {showCount ? (
        <span className="text-xs tabular-nums opacity-70" aria-label={`${option.count} نتيجة`}>
          {formatNumber(option.count)}
        </span>
      ) : null}
    </FilterLink>
  );
}

type FacetChipsProps = {
  facets: FacetGroupVM[];
  /** Counts describe the catalog, not a keyword search, so they are hidden while one is active. */
  showCounts: boolean;
};

/**
 * Quick filters: one row of chips per facet. Every chip is a link to the search with that option
 * toggled. On phones a row scrolls sideways instead of wrapping, so four rows stay four lines.
 */
export function FacetChips({ facets, showCounts }: FacetChipsProps) {
  return (
    // Plain blocks, not a flex column: a flex item would grow to the full width of its scrolling
    // chip row and push the page sideways on phones.
    <div className="space-y-4">
      {facets.map((facet) => {
        const labelId = `facet-${facet.key}`;
        return (
          <div key={facet.key} role="group" aria-labelledby={labelId} className="min-w-0 max-md:space-y-2 md:flex md:gap-4">
            <h3 id={labelId} className="m-0 shrink-0 text-sm leading-9 font-medium text-fg-muted md:w-16">
              {facet.label}
            </h3>
            <div className="min-w-0 flex-1 space-y-2">
              <ul className="-mx-4 m-0 flex list-none gap-2 overflow-x-auto p-0 px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
                {facet.options.map((option) => (
                  <li key={option.code} className="shrink-0">
                    <Chip option={option} showCount={showCounts} />
                  </li>
                ))}
              </ul>
              {facet.more.length > 0 ? (
                <details className="group">
                  <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-1 text-sm font-medium text-fg underline decoration-accent decoration-2 underline-offset-4 [&::-webkit-details-marker]:hidden">
                    <span className="group-open:hidden">عرض {formatNumber(facet.more.length)} أخرى</span>
                    <span className="hidden group-open:inline">عرض أقل</span>
                  </summary>
                  <ul className="m-0 mt-2 flex list-none flex-wrap gap-2 p-0">
                    {facet.more.map((option) => (
                      <li key={option.code}>
                        <Chip option={option} showCount={showCounts} />
                      </li>
                    ))}
                  </ul>
                </details>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
