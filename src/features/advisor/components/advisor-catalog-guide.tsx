"use client";

import type { Route } from "next";

import { AppLink } from "@/components/ui/app-link";
import { routes } from "@/config/routes";
import { useExploreMenu } from "@/features/navigation/components/menu-context";

import { advisorCopy } from "../content/copy";
import { closeAdvisorOnSmallScreen } from "../model/store";

/** Sectors shown at most; the search page has the rest. */
const MAX_SECTORS = 10;

type GuideLink = { key: string; label: string; href: Route; count?: number };

/** Without the header menu's data (a failed read), the product types still have their listings. */
const FALLBACK_OFFER: GuideLink[] = [
  { key: "course", label: "الدورات", href: routes.courses },
  { key: "diploma", label: "الدبلومات", href: routes.diplomas },
  { key: "package", label: "الباقات", href: routes.packages },
  { key: "consultation", label: "الاستشارات", href: routes.consultations },
];

const searchCategory = (slug: string) => `${routes.search}?category=${encodeURIComponent(slug)}` as Route;

function GuideChip({ link }: { link: GuideLink }) {
  return (
    <AppLink href={link.href} onClick={closeAdvisorOnSmallScreen} className="ma-btn ma-btn--soft ma-btn--sm min-h-11 gap-1.5">
      {link.label}
      {link.count ? <span className="text-xs text-fg-muted tabular-nums">{link.count}</span> : null}
    </AppLink>
  );
}

/**
 * Shown under an answer that found nothing in the catalog (or failed): what Mastery offers, by
 * product type and by sector, each a link into the search page. Reads the header menu's catalog
 * data, already on the page, so it costs no request.
 */
export function AdvisorCatalogGuide({ failed }: { failed?: boolean }) {
  const menu = useExploreMenu();
  const groups = menu?.groups ?? [];

  const offer: GuideLink[] = groups.length
    ? groups.map((group) => ({ key: group.type, label: group.label, href: group.href, count: group.count }))
    : FALLBACK_OFFER;
  offer.push({ key: "live", label: advisorCopy.guideLive, href: routes.live });

  // The same sector appears under each product type; list it once, across all of them.
  const sectors = new Map<string, GuideLink>();
  for (const group of groups) {
    for (const category of group.categories) {
      const existing = sectors.get(category.slug);
      sectors.set(category.slug, {
        key: category.slug,
        label: category.name,
        href: searchCategory(category.slug),
        count: (existing?.count ?? 0) + category.count,
      });
    }
  }
  const topSectors = [...sectors.values()].sort((a, b) => (b.count ?? 0) - (a.count ?? 0)).slice(0, MAX_SECTORS);

  return (
    <section aria-label={advisorCopy.guideOffer} className="flex flex-col gap-3 rounded-panel border border-line p-3">
      <p className="m-0 text-sm leading-7">{failed ? advisorCopy.guideFailed : advisorCopy.guideNoResults}</p>

      <div className="flex flex-col gap-2">
        <h3 className="m-0 text-xs font-bold text-fg-muted">{advisorCopy.guideOffer}</h3>
        <div className="flex flex-wrap gap-2">
          {offer.map((link) => (
            <GuideChip key={link.key} link={link} />
          ))}
        </div>
      </div>

      {topSectors.length ? (
        <div className="flex flex-col gap-2">
          <h3 className="m-0 text-xs font-bold text-fg-muted">{advisorCopy.guideSectors}</h3>
          <div className="flex flex-wrap gap-2">
            {topSectors.map((link) => (
              <GuideChip key={link.key} link={{ ...link, count: undefined }} />
            ))}
          </div>
        </div>
      ) : null}

      <AppLink href={routes.search} onClick={closeAdvisorOnSmallScreen} className="ma-btn ma-btn--secondary ma-btn--sm min-h-11 self-start">
        {advisorCopy.guideBrowseAll}
      </AppLink>
    </section>
  );
}
