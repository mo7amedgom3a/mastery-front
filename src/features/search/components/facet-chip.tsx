import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";

import type { FacetOptionVM } from "../model/types";
import { FilterLink } from "./search-nav";

type FacetChipProps = {
  option: FacetOptionVM;
  /** Counts describe the catalog, not a keyword search, so they are hidden while one is active. */
  showCount: boolean;
};

/** One facet option: a link to the search with it toggled. */
export function FacetChip({ option, showCount }: FacetChipProps) {
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
