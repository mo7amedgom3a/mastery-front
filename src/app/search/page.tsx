import type { Metadata } from "next";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { baseOpenGraph } from "@/config/site";
import { resolveSearchState } from "@/features/search/api/get-search-page";
import { searchCopy } from "@/features/search/content/copy";
import { searchHeading } from "@/features/search/model/mappers";
import { emptySearchState, isIndexableState, searchHref } from "@/features/search/model/params";
import { SearchPage } from "@/features/search/search-page";

// Rendered per request: the filters live in the query string. The API reads behind it are cached
// for facet-only listings (see `getSearchView`), so those stay fast.

export async function generateMetadata({ searchParams }: PageProps<"/search">): Promise<Metadata> {
  const { state, catalog } = await resolveSearchState(await searchParams);
  const isRoot = searchHref({ ...state, page: 1 }) === searchHref(emptySearchState);
  const heading = isRoot ? "كل الدورات والدبلومات والباقات والاستشارات" : searchHeading(state, catalog);
  const title = state.page > 1 ? `${heading} — الصفحة ${state.page}` : heading;
  const description = isRoot ? searchCopy.description : `${heading} في ماستري أكاديمي. ${searchCopy.lead}`;
  const href = searchHref(state);

  // Keyword searches and fine filter combinations are thin or duplicate pages: crawlable, not indexed.
  if (!isIndexableState(state)) {
    return { title, description, robots: { index: false, follow: true } };
  }
  return {
    title,
    description,
    alternates: { canonical: href, languages: { ar: href, "x-default": href } },
    openGraph: { ...baseOpenGraph, url: href, title, description },
  };
}

export default async function SearchRoute({ searchParams }: PageProps<"/search">) {
  const { state, catalog } = await resolveSearchState(await searchParams);
  return (
    <>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="outline-none">
        <SearchPage state={state} catalog={catalog} heading={searchHeading(state, catalog)} />
      </main>
      <SiteFooter />
    </>
  );
}
