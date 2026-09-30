import { SlidersHorizontal, TriangleAlert } from "lucide-react";
import { redirect } from "next/navigation";

import { Pagination } from "@/components/ui/pagination";
import { ProductCard } from "@/components/ui/product-card";
import { toCard } from "@/features/product-detail/sections/product-rails";
import { formatCount, formatNumber } from "@/lib/format";

import { getSearchView } from "../api/get-search-page";
import { ActiveFilters } from "../components/active-filters";
import { FacetChips } from "../components/facet-chips";
import { FILTER_PANEL_ID, FilterPanel } from "../components/filter-panel";
import { AutoSubmitSelect, FilterLink, PendingRegion, SearchForm } from "../components/search-nav";
import { StateInputs } from "../components/state-inputs";
import { NEWEST_LABEL, RESULT_FORMS, sortLabel } from "../content/copy";
import {
  PAGE_SIZE,
  SORTS,
  clearFilters,
  emptySearchState,
  hasFilters,
  isIndexableState,
  searchHref,
  withFilters,
  type SearchSort,
  type SearchState,
} from "../model/params";
import type { SearchCatalog, SearchResultsVM } from "../model/types";
import { SearchJsonLd } from "../seo/json-ld";

/** Three cards per row beside the sidebar, two on tablets, one on phones. */
const CARD_SIZES = "(min-width: 1200px) 290px, (min-width: 900px) 40vw, (min-width: 600px) 45vw, 100vw";
const GRID = "m-0 grid list-none gap-6 p-0 sm:grid-cols-2 lg:grid-cols-3";

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

function EmptyState({ state, catalog }: { state: SearchState; catalog: SearchCatalog }) {
  const filtered = hasFilters(state);
  return (
    <div className="flex flex-col items-start gap-4 border border-line p-6 md:p-10">
      <h2 className="m-0 text-2xl leading-10 font-bold">لم نجد برامج مطابقة</h2>
      <p className="m-0 max-w-[52ch] text-fg-muted">
        {state.q
          ? "جرّب كلمات أقل أو أعمّ، أو تحقّق من الإملاء."
          : "لا توجد برامج بهذه الفلاتر معاً. أزل أحدها لترى نتائج أكثر."}
      </p>
      <ul className="ma-cluster m-0 list-none p-0">
        {filtered ? (
          <li>
            <FilterLink href={searchHref(clearFilters(state))} rel="nofollow" className="ma-btn ma-btn--outline">
              امسح الفلاتر
            </FilterLink>
          </li>
        ) : null}
        {state.q && state.mode === "lexical" ? (
          <li>
            <FilterLink
              href={searchHref(withFilters(state, { mode: "hybrid" }))}
              rel="nofollow"
              className="ma-btn ma-btn--outline"
            >
              فعّل البحث الذكي
            </FilterLink>
          </li>
        ) : null}
        <li>
          <FilterLink href={searchHref(emptySearchState)} className="ma-btn ma-btn--ghost">
            تصفّح كل البرامج
          </FilterLink>
        </li>
      </ul>
      {catalog.topCategories.length > 0 ? (
        <div className="mt-2 flex flex-col gap-3">
          <p className="m-0 text-sm font-medium">أو ابدأ من أحد المجالات:</p>
          <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
            {catalog.topCategories.map((category) => (
              <li key={category.code}>
                <FilterLink
                  href={searchHref({ ...emptySearchState, categories: [category.code] })}
                  className="ma-btn ma-btn--outline ma-btn--sm max-md:min-h-11"
                >
                  {category.label}
                </FilterLink>
              </li>
            ))}
          </ul>
        </div>
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
        {results.cards.map((card) => (
          <li key={card.key} className="min-w-0">
            <ProductCard {...toCard(card)} tags={card.tags} sizes={CARD_SIZES} />
          </li>
        ))}
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
};

/**
 * Everything that depends on the search request: the quick-filter chips (their counts follow the
 * filters), the filters in force, the side panel, the toolbar and the results. Streams in behind
 * the page header; later filter changes swap it in place (see `SearchNavProvider`).
 */
export async function SearchResults({ state, catalog, heading }: SearchResultsProps) {
  const view = await getSearchView(state, catalog);
  const { results } = view;

  // A page past the end (a stale link, a filter that shrank the list) goes to the last real page.
  if (results && results.total > 0 && state.page > results.pageCount) {
    redirect(searchHref({ ...state, page: results.pageCount }));
  }

  return (
    <PendingRegion className="min-w-0 space-y-8">
      <section aria-label="فلاتر سريعة" className="min-w-0 space-y-6">
        <FacetChips facets={view.facets} showCounts={view.countsKnown && !state.q} />
        <ActiveFilters state={state} filters={view.activeFilters} />
      </section>

      <div className="md:grid md:grid-cols-[16rem_minmax(0,1fr)] md:items-start md:gap-10">
        <FilterPanel state={state} trainers={catalog.trainers} />

        <section aria-labelledby="results-title" className="min-w-0">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-line pb-4">
            <h2 id="results-title" className="sr-only">
              النتائج
            </h2>
            {/* Announced on every filter change: the count is the feedback that it worked. */}
            <p role="status" className="m-0 font-medium">
              {results
                ? results.total > 0
                  ? `${formatCount(results.total, RESULT_FORMS)}${
                      results.pageCount > 1
                        ? ` · الصفحة ${formatNumber(state.page)} من ${formatNumber(results.pageCount)}`
                        : ""
                    }`
                  : "لا توجد نتائج"
                : null}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                popoverTarget={FILTER_PANEL_ID}
                className="ma-btn ma-btn--outline ma-btn--sm min-h-11 md:hidden"
              >
                <SlidersHorizontal aria-hidden="true" className="size-4 fill-none" />
                الفلاتر
              </button>
              <SortControl state={state} />
            </div>
          </div>

          {!results ? (
            <ErrorState state={state} />
          ) : results.cards.length === 0 ? (
            <EmptyState state={state} catalog={catalog} />
          ) : (
            <ResultGrid state={state} results={results} heading={heading} />
          )}
        </section>
      </div>
    </PendingRegion>
  );
}

const SKELETON_CHIP_WIDTHS = ["w-20", "w-28", "w-24", "w-32", "w-20", "w-24"];

/** First-load placeholder with the same footprint as the chips and the card grid. */
export function SearchResultsSkeleton() {
  return (
    <div role="status" className="min-w-0 space-y-8">
      <span className="sr-only">جارٍ تحميل النتائج…</span>
      <div aria-hidden="true" className="space-y-4">
        {[0, 1, 2].map((row) => (
          <div key={row} className="flex gap-2 overflow-hidden">
            {SKELETON_CHIP_WIDTHS.map((width, index) => (
              <div key={index} className={`h-9 shrink-0 animate-pulse bg-line ${width}`} />
            ))}
          </div>
        ))}
      </div>
      <div aria-hidden="true" className="md:grid md:grid-cols-[16rem_minmax(0,1fr)] md:gap-10">
        <div className="h-96 animate-pulse bg-line max-md:hidden" />
        <ul className={GRID}>
          {Array.from({ length: 6 }, (_, index) => (
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
    </div>
  );
}
