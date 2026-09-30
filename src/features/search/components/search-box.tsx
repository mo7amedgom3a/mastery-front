import { Search, Sparkles } from "lucide-react";

import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/cn";

import { searchCopy } from "../content/copy";
import { searchHref, withFilters, type SearchState } from "../model/params";
import { FilterLink, SearchForm } from "./search-nav";
import { StateInputs } from "./state-inputs";

/** The query field with the page's one primary action, and the smart-search switch under it. */
export function SearchBox({ state }: { state: SearchState }) {
  // Off by default: the visitor turns it on. "Smart" is anything that reads meaning (hybrid, or
  // semantic from a hand-written URL).
  const smart = state.mode !== "lexical";

  return (
    <div className="flex flex-col gap-3">
      <SearchForm role="search" aria-label="البحث في البرامج" className="flex flex-col gap-3 sm:flex-row">
        <StateInputs state={state} omit={["q"]} />
        <label htmlFor="search-q" className="sr-only">
          كلمات البحث
        </label>
        <input
          // Re-created when the query in the URL changes (back/forward, cleared search).
          key={state.q}
          id="search-q"
          name="q"
          type="search"
          defaultValue={state.q}
          placeholder={searchCopy.placeholder}
          maxLength={200}
          enterKeyHint="search"
          autoComplete="off"
          className="ma-input min-h-14 min-w-0 flex-1 text-lg"
        />
        <button type="submit" className={cn(buttonClass({ variant: "primary", size: "lg" }), "max-sm:w-full")}>
          <Search aria-hidden="true" className="size-5 fill-none" />
          {searchCopy.submit}
        </button>
      </SearchForm>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <FilterLink
          href={searchHref(withFilters(state, { mode: smart ? "lexical" : "hybrid" }))}
          role="switch"
          aria-checked={smart}
          rel="nofollow"
          className={cn(buttonClass({ variant: smart ? "secondary" : "outline", size: "sm" }), "min-h-11")}
        >
          <Sparkles aria-hidden="true" className="size-4 fill-none" />
          {searchCopy.smart}
        </FilterLink>
        <span className="text-sm text-fg-muted">{smart ? searchCopy.smartOn : searchCopy.smartOff}</span>
      </div>
    </div>
  );
}
