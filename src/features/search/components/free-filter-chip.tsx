import { Gift } from "lucide-react";

import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/cn";

import { freeToggleHref, type SearchState } from "../model/params";
import { FilterLink } from "./search-nav";

/** "Free only": a link to the search with it toggled, styled like a selected or idle facet chip. */
export function FreeFilterChip({ state, className }: { state: SearchState; className?: string }) {
  return (
    <FilterLink
      href={freeToggleHref(state)}
      aria-current={state.free ? "true" : undefined}
      rel="nofollow"
      className={cn(
        buttonClass({ variant: state.free ? "secondary" : "soft", size: "sm" }),
        "min-h-11 gap-2 max-sm:gap-1 max-sm:px-2.5",
        className,
      )}
    >
      <Gift aria-hidden="true" className="size-4 fill-none" />
      مجاني
    </FilterLink>
  );
}
