import { Suspense } from "react";

import { SearchNavProvider } from "./components/search-nav";
import { emptySearchState, searchHref, type SearchState } from "./model/params";
import type { SearchCatalog } from "./model/types";
import { SearchHero } from "./sections/search-hero";
import { SearchResults, SearchResultsSkeleton } from "./sections/search-results";

type SearchPageProps = {
  state: SearchState;
  catalog: SearchCatalog;
  heading: string;
};

/**
 * The catalog listing for every product type. The header (heading and search box) renders at once;
 * the chips and results stream in behind a skeleton on the first load, and are replaced in place
 * on every later filter change.
 */
export function SearchPage({ state, catalog, heading }: SearchPageProps) {
  const isRoot = searchHref({ ...state, page: 1 }) === searchHref(emptySearchState);
  return (
    <SearchNavProvider>
      <SearchHero state={state} heading={heading} isRoot={isRoot} />
      <div className="ma-section pt-8 md:pt-10">
        <div className="ma-container">
          <Suspense fallback={<SearchResultsSkeleton />}>
            <SearchResults state={state} catalog={catalog} heading={heading} isRoot={isRoot} />
          </Suspense>
        </div>
      </div>
    </SearchNavProvider>
  );
}
