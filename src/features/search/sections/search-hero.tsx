import { ChevronLeft } from "lucide-react";

import { AppLink } from "@/components/ui/app-link";
import { routes } from "@/config/routes";

import { SearchBox } from "../components/search-box";
import { searchCopy } from "../content/copy";
import type { SearchState } from "../model/params";

type SearchHeroProps = {
  state: SearchState;
  heading: string;
  /** True on the unfiltered listing, where the heading is the page itself. */
  isRoot: boolean;
};

/** Page header on the alt surface: breadcrumb, the H1 for this list, and the search box. */
export function SearchHero({ state, heading, isRoot }: SearchHeroProps) {
  return (
    <section aria-labelledby="search-title" className="border-b border-line bg-surface-alt text-fg">
      <div className="ma-container pt-8 pb-10 md:pt-12 md:pb-14">
        <nav aria-label="مسار التصفح">
          <ol className="m-0 flex list-none flex-wrap items-center gap-1 p-0 text-sm text-fg-muted">
            <li>
              <AppLink href={routes.home} className="text-fg-muted no-underline hover:text-fg">
                الرئيسية
              </AppLink>
            </li>
            <li aria-hidden="true">
              <ChevronLeft className="size-4" />
            </li>
            {isRoot ? (
              <li aria-current="page" className="text-fg">
                كل البرامج
              </li>
            ) : (
              <>
                <li>
                  <AppLink href={routes.search} className="text-fg-muted no-underline hover:text-fg">
                    كل البرامج
                  </AppLink>
                </li>
                <li aria-hidden="true">
                  <ChevronLeft className="size-4" />
                </li>
                <li aria-current="page" className="line-clamp-1 max-w-[40ch] text-fg">
                  {heading}
                </li>
              </>
            )}
          </ol>
        </nav>

        <h1 id="search-title" className="t-section m-0 mt-6 max-w-[24ch] break-words md:mt-8">
          {isRoot ? searchCopy.pageTitle : heading}
        </h1>
        {isRoot ? <p className="t-lead m-0 mt-4 max-w-[60ch]">{searchCopy.lead}</p> : null}

        <div className="mt-8 max-w-[52rem]">
          <SearchBox state={state} />
        </div>
      </div>
    </section>
  );
}
