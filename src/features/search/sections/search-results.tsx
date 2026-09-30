import { Sparkles, TriangleAlert } from "lucide-react";
import { redirect } from "next/navigation";

import { Pagination } from "@/components/ui/pagination";
import { ProductCard } from "@/components/ui/product-card";
import { toCard } from "@/features/product-detail/sections/product-rails";
import { formatCount, formatNumber } from "@/lib/format";

import { getSearchView } from "../api/get-search-page";
import { ActiveFilters } from "../components/active-filters";
import { FacetBar } from "../components/facet-bar";
import { FilterPanel } from "../components/filter-panel";
import { RecommendationRail } from "../components/recommendation-rail";
import { AutoSubmitSelect, FilterLink, PendingRegion, SearchForm } from "../components/search-nav";
import { StateInputs } from "../components/state-inputs";
import { NEWEST_LABEL, RESULT_FORMS, sortLabel } from "../content/copy";
import {
  PAGE_SIZE,
  SORTS,
  clearFilters,
  hasFilters,
  isIndexableState,
  searchHref,
  withFilters,
  type SearchSort,
  type SearchState,
} from "../model/params";
import type { SearchCatalog, SearchResultsVM } from "../model/types";
import { SearchJsonLd } from "../seo/json-ld";

/** Four cards per row on desktop, three from 900px, two on tablets, one on phones. */
const CARD_SIZES = "(min-width: 1200px) 290px, (min-width: 900px) 30vw, (min-width: 600px) 45vw, 100vw";
const GRID = "m-0 grid list-none gap-6 p-0 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4";

function SortControl({ state }: { state: SearchState }) {
  // Without a query nothing is ranked: the default order is "newest", so it takes that label.
  const options: { value: SearchSort; label: string }[] = SORTS.map((sort) => ({
    value: sort,
    label: !state.q && sort === "relevance" ? NEWEST_LABEL : sortLabel[sort],
  }));

  return (
    <SearchForm className="flex items-center gap-2">
      <StateInputs state={state} omit={["sort"]} />
      <label htmlFor="search-sort" className="shrink-0 text-sm text-fg-muted">
        الترتيب
      </label>
      <AutoSubmitSelect
        key={state.sort}
        id="search-sort"
        name="sort"
        defaultValue={state.sort}
        className="ma-select min-h-11 w-auto py-2 text-sm"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </AutoSubmitSelect>
      {/* Without JavaScript the select can't submit itself. */}
      <noscript>
        <button type="submit" className="ma-btn ma-btn--outline ma-btn--sm min-h-11">
          رتّب
        </button>
      </noscript>
    </SearchForm>
  );
}

/** A search that matched nothing: why, and the quickest ways out. Recommendations follow below it. */
function EmptyState({ state }: { state: SearchState }) {
  const filtered = hasFilters(state);
  const canGoSmart = Boolean(state.q) && state.mode === "lexical";
  return (
    <div className="flex flex-col items-start gap-4 border border-line p-6 md:p-10">
      <h2 className="m-0 text-2xl leading-10 font-bold">لم نجد برامج مطابقة</h2>
      <p className="m-0 max-w-[52ch] text-fg-muted">
        {state.q
          ? canGoSmart
            ? "البحث العادي يطابق الكلمات كما كتبتها. فعّل البحث الذكي ليبحث بالمعنى، أو جرّب كلمات أقل."
            : "جرّب كلمات أقل أو أعمّ، أو تحقّق من الإملاء."
          : "لا توجد برامج بهذه الفلاتر معاً. أزل أحدها لترى نتائج أكثر."}
      </p>
      {canGoSmart || filtered ? (
        <ul className="ma-cluster m-0 list-none p-0">
          {canGoSmart ? (
            <li>
              <FilterLink
                href={searchHref(withFilters(state, { mode: "hybrid" }))}
                rel="nofollow"
                className="ma-btn ma-btn--secondary"
              >
                <Sparkles aria-hidden="true" className="size-5 fill-none" />
                فعّل البحث الذكي
              </FilterLink>
            </li>
          ) : null}
          {filtered ? (
            <li>
              <FilterLink href={searchHref(clearFilters(state))} rel="nofollow" className="ma-btn ma-btn--outline">
                امسح الفلاتر
              </FilterLink>
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}

function ErrorState({ state }: { state: SearchState }) {
  return (
    <div className="ma-alert ma-alert--danger" role="alert">
      <TriangleAlert aria-hidden="true" className="fill-none" />
      <div>
        <p className="ma-alert__title">تعذّر تحميل النتائج</p>
        <p className="ma-alert__text">
          حدث خطأ أثناء البحث. {/* A plain link: a full reload also retries the requests that failed. */}
          <a href={searchHref(state)} className="font-bold text-ink underline">
            أعد المحاولة
          </a>
          .
        </p>
      </div>
    </div>
  );
}

function ResultGrid({ state, results, heading }: { state: SearchState; results: SearchResultsVM; heading: string }) {
  return (
    <>
      <ul className={GRID}>
        {results.cards.map((card) => {
          // `toCard` returns a key for list rendering; React wants it passed on its own.
          const { key, ...props } = toCard(card);
          return (
            <li key={key} className="min-w-0">
              <ProductCard {...props} tags={card.tags} sizes={CARD_SIZES} />
            </li>
          );
        })}
      </ul>
      <Pagination
        page={state.page}
        pageCount={results.pageCount}
        hrefFor={(page) => searchHref({ ...state, page })}
        label="صفحات النتائج"
        link={PageLink}
        className="mt-10"
      />
      {isIndexableState(state) ? (
        <SearchJsonLd
          href={searchHref(state)}
          heading={heading}
          cards={results.cards}
          start={(state.page - 1) * PAGE_SIZE + 1}
        />
      ) : null}
    </>
  );
}

/** Pagination goes back to the top of the list; filter links stay where they are. */
function PageLink(props: Omit<Parameters<typeof FilterLink>[0], "scroll">) {
  return <FilterLink scroll {...props} />;
}

type SearchResultsProps = {
  state: SearchState;
  catalog: SearchCatalog;
  heading: string;
  /** The unfiltered listing: where a visitor lands first. */
  isRoot: boolean;
};

/**
 * Everything that depends on the search request: the filter bar (its counts follow the filters),
 * the filters in force, the drawer with every filter, the toolbar and the results. Streams in
 * behind the page header; later filter changes swap it in place (see `SearchNavProvider`).
 */
export async function SearchResults({ state, catalog, heading, isRoot }: SearchResultsProps) {
  const view = await getSearchView(state, catalog);
  const { results } = view;

  // A page past the end (a stale link, a filter that shrank the list) goes to the last real page.
  if (results && results.total > 0 && state.page > results.pageCount) {
    redirect(searchHref({ ...state, page: results.pageCount }));
  }

  const empty = results !== null && results.cards.length === 0;
  // Recommendations open the unfiltered listing, and stand in for results when a search has none.
  const startRail = isRoot && state.page === 1;
  const fallbackRail = empty && !startRail;
  // Counts describe the catalog, not a keyword search, so they are hidden while one is active.
  const showCounts = view.countsKnown && !state.q;

  return (
    <div className="min-w-0 space-y-8">
      {startRail ? <RecommendationRail className="border-b border-line pb-10" /> : null}

      <div className="min-w-0">
        <section aria-label="الفلاتر" className="space-y-4">
          <FacetBar facets={view.facets} showCounts={showCounts} activeCount={view.activeFilters.length} />
          <ActiveFilters state={state} filters={view.activeFilters} />
        </section>
        <FilterPanel state={state} facets={view.facets} showCounts={showCounts} trainers={catalog.trainers} />

        <PendingRegion className="mt-6 min-w-0">
          <section aria-labelledby="results-title">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-y border-line py-3">
              <h2 id="results-title" className="sr-only">
                النتائج
              </h2>
              {/* Announced on every filter change: the count is the feedback that it worked. */}
              <p role="status" className="m-0 font-medium">
                {results && results.total > 0
                  ? `${formatCount(results.total, RESULT_FORMS)}${
                      results.pageCount > 1
                        ? ` · الصفحة ${formatNumber(state.page)} من ${formatNumber(results.pageCount)}`
                        : ""
                    }`
                  : results && !isRoot
                    ? "لا توجد نتائج"
                    : null}
              </p>
              <SortControl state={state} />
            </div>

            {!results ? (
              <ErrorState state={state} />
            ) : !empty ? (
              <ResultGrid state={state} results={results} heading={heading} />
            ) : isRoot ? (
              // Nothing was searched for, so nothing was "not found": the rail above is the page.
              <p className="m-0 text-fg-muted">لا توجد برامج معروضة هنا الآن.</p>
            ) : (
              <EmptyState state={state} />
            )}
          </section>
        </PendingRegion>
      </div>

      {fallbackRail ? <RecommendationRail className="border-t border-line pt-10" /> : null}
    </div>
  );
}

const SKELETON_BUTTON_WIDTHS = ["w-20", "w-24", "w-24", "w-20"];

/** First-load placeholder with the same footprint as the filter bar and the card grid. */
export function SearchResultsSkeleton() {
  return (
    <div role="status" className="min-w-0">
      <span className="sr-only">جارٍ تحميل النتائج…</span>
      <div aria-hidden="true" className="flex gap-2 overflow-hidden">
        {SKELETON_BUTTON_WIDTHS.map((width, index) => (
          <div key={index} className={`h-11 shrink-0 animate-pulse bg-line ${width}`} />
        ))}
      </div>
      <div aria-hidden="true" className="mt-6 mb-6 h-14 border-y border-line" />
      <ul aria-hidden="true" className={GRID}>
        {Array.from({ length: 8 }, (_, index) => (
          <li key={index} className="border border-line">
            <div className="aspect-[16/10] animate-pulse bg-line" />
            <div className="flex flex-col gap-3 p-4">
              <div className="h-5 w-3/4 animate-pulse bg-line" />
              <div className="h-4 w-full animate-pulse bg-line" />
              <div className="h-4 w-1/2 animate-pulse bg-line" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
