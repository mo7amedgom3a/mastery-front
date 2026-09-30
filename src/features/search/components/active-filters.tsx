import { X } from "lucide-react";

import { searchHref, clearFilters, type SearchState } from "../model/params";
import type { ActiveFilterVM } from "../model/types";
import { FilterLink } from "./search-nav";

/** The filters in force, each removable on its own, and one link to drop them all. */
export function ActiveFilters({ state, filters }: { state: SearchState; filters: ActiveFilterVM[] }) {
  if (filters.length === 0) {
    return null;
  }
  return (
    <div role="group" aria-label="الفلاتر المفعّلة" className="flex flex-wrap items-center gap-2">
      <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
        {filters.map((filter) => (
          <li key={filter.key}>
            <FilterLink
              href={filter.href}
              rel="nofollow"
              aria-label={`إزالة الفلتر: ${filter.label}`}
              className="ma-tag ma-tag--ink min-h-9 gap-2 px-3 text-sm no-underline max-md:min-h-11"
            >
              {filter.label}
              <X aria-hidden="true" className="size-3.5" />
            </FilterLink>
          </li>
        ))}
      </ul>
      <FilterLink
        href={searchHref(clearFilters(state))}
        rel="nofollow"
        className="ma-link inline-flex min-h-11 items-center px-2 text-sm"
      >
        مسح الكل
      </FilterLink>
    </div>
  );
}
