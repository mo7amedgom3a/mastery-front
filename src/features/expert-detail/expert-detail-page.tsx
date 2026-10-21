import type { ReactNode } from "react";

import { AppLink } from "@/components/ui/app-link";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getSiteUrl } from "@/config/env";
import { routes } from "@/config/routes";
import { ExpertGrid } from "@/features/experts-directory/components/expert-card";
import { CtaBand } from "@/features/landing/sections/cta-band";
import { toQrMatrix } from "@/features/product-detail/api/share-qr";
import { SectionNav, type SectionNavItem } from "@/features/product-detail/components/section-nav";
import { ShareButton } from "@/features/product-detail/components/share-dialog";

import { expertFacts } from "./model/facts";
import type { ExpertDetailData } from "./model/types";
import { defaultBodyNav, ExpertBody, pageNav } from "./sections/expert-body";
import { ExpertHero } from "./sections/expert-hero";
import { ExpertRecommendedRail, RelatedConsultationsRail, RelatedProgramsRail } from "./sections/expert-rails";
import { ExpertJsonLd } from "./seo/json-ld";

/**
 * Expert profile: hero → the body → related experts → other experts' programs in the same fields →
 * recommendations. The body (`ExpertBody`) is the page built in the expert Studio when one is published, else the
 * default sections: about, fields and skills, how they help, and everything they offer. One page for a trainer, a
 * consultant, or someone who is both. Only the section nav, share and the cards' buttons hydrate.
 *
 * `body` replaces the body: the Studio preview passes its live version there.
 */
export function ExpertDetailPage({ data, body }: { data: ExpertDetailData; body?: ReactNode }) {
  const { expert } = data;
  const facts = expertFacts(expert.counts);
  const shareUrl = `${getSiteUrl()}${expert.href}`;
  const nav: SectionNavItem[] = [
    ...(expert.page.length > 0 ? pageNav(expert.page) : defaultBodyNav(data)),
    ...(data.relatedExperts.length > 0 ? [{ id: "related-experts", label: "مدربون مشابهون" }] : []),
  ];

  return (
    <>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="outline-none">
        <ExpertHero
          expert={expert}
          share={
            <ShareButton
              url={shareUrl}
              title={expert.name}
              kindLabel="خبير"
              tagClassName="ma-tag--coral"
              facts={facts.map((fact) => fact.label)}
              // The share card shows the expert's photo beside their name.
              trainers={[{ name: expert.name, avatar: expert.avatar, initial: expert.initial }]}
              personLabels={["الخبير", "الخبراء"]}
              // Scans are tagged so they can be told apart from other visits in analytics.
              qr={toQrMatrix(`${shareUrl}?utm_source=qr&utm_medium=share`)}
              fileName={`expert-${expert.key}`}
            />
          }
        />

        <SectionNav items={nav} />

        <div className="ma-container flex flex-col gap-16 py-12 md:py-16">
          {body ?? <ExpertBody data={data} />}
          {data.relatedExperts.length > 0 ? (
            <section
              id="related-experts"
              aria-labelledby="related-experts-title"
              className="scroll-mt-[calc(var(--header-h)+4.5rem)]"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b border-line-strong pb-4">
                <h2 id="related-experts-title" className="m-0 text-2xl font-bold">
                  مدربون وخبراء في نفس المجالات
                </h2>
                <AppLink href={routes.experts} className="text-fg-muted underline-offset-4 hover:text-fg">
                  كل المدربين
                </AppLink>
              </div>
              <div className="mt-8">
                <ExpertGrid experts={data.relatedExperts} label="مدربون مشابهون" />
              </div>
            </section>
          ) : null}
        </div>

        <RelatedProgramsRail cards={data.relatedPrograms} fields={expert.specialties.slice(0, 2).join(" و") || null} />
        <RelatedConsultationsRail cards={data.relatedConsultations} />
        <ExpertRecommendedRail cards={data.recommended} />
        <CtaBand />
      </main>
      <SiteFooter />
      <ExpertJsonLd expert={expert} />
    </>
  );
}
