import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getSiteUrl } from "@/config/env";
import { CtaBand } from "@/features/landing/sections/cta-band";
import { toQrMatrix } from "@/features/product-detail/api/share-qr";
import { SectionNav, type SectionNavItem } from "@/features/product-detail/components/section-nav";
import { ShareButton } from "@/features/product-detail/components/share-dialog";
import { TextBlocks } from "@/features/product-detail/components/text-blocks";

import { expertFacts } from "./model/facts";
import type { ExpertDetailData } from "./model/types";
import { ExpertHero } from "./sections/expert-hero";
import { ExpertHighlights } from "./sections/expert-highlights";
import { ExpertRecommendedRail, RelatedConsultationsRail, RelatedProgramsRail } from "./sections/expert-rails";
import { ExpertServices, type ExpertServiceGroup } from "./sections/expert-services";
import { ExpertJsonLd } from "./seo/json-ld";

/**
 * Expert profile: hero → bio → how they help → everything they offer (consultations, courses,
 * diplomas, packages) → other experts' programs in the same fields → recommendations. One page for
 * a trainer, a consultant, or someone who is both. Pure composition over view models; only the
 * section nav, share and the cards' cart/wishlist buttons hydrate.
 */
export function ExpertDetailPage({ data }: { data: ExpertDetailData }) {
  const { expert } = data;
  const facts = expertFacts(expert.counts);
  const countOf = (key: ExpertServiceGroup["id"]) => facts.find((fact) => fact.key === key)?.label ?? "";
  const shareUrl = `${getSiteUrl()}${expert.href}`;
  const hasHighlights = expert.whatTheyDo.length > 0 || expert.whoTheyHelp.length > 0;

  // Consultations lead: they are the expert's own time, the rest is recorded.
  const groups: ExpertServiceGroup[] = [
    { id: "consultations" as const, title: "الاستشارات", count: countOf("consultations"), cards: data.consultations },
    { id: "courses" as const, title: "الدورات", count: countOf("courses"), cards: data.courses },
    { id: "diplomas" as const, title: "الدبلومات", count: countOf("diplomas"), cards: data.diplomas },
    { id: "packages" as const, title: "الباقات", count: countOf("packages"), cards: data.packages },
  ].filter((group) => group.cards.length > 0);

  const nav: SectionNavItem[] = [
    expert.bio.length > 0 ? { id: "about", label: "نبذة" } : null,
    hasHighlights ? { id: "highlights", label: "كيف يساعدك" } : null,
    ...groups.map((group) => ({ id: group.id, label: group.title })),
  ].filter((item) => item !== null);

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
          {expert.bio.length > 0 ? (
            <section id="about" aria-labelledby="about-title" className="scroll-mt-[calc(var(--header-h)+4.5rem)]">
              <h2 id="about-title" className="m-0 text-2xl font-bold">
                نبذة عن {expert.name}
              </h2>
              {/* Full container width: the bio is the body of this page, not a column beside a card. */}
              <TextBlocks blocks={expert.bio} className="mt-6 max-w-none" />
            </section>
          ) : null}
          <ExpertHighlights name={expert.name} whatTheyDo={expert.whatTheyDo} whoTheyHelp={expert.whoTheyHelp} />
          <ExpertServices groups={groups} />
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
