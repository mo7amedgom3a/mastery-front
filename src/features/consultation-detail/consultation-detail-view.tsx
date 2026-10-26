import type { ComponentProps } from "react";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { CtaBand } from "@/features/landing/sections/cta-band";
import { FaqSection } from "@/features/landing/sections/faq-section";
import { SectionNav, type SectionNavItem } from "@/features/product-detail/components/section-nav";
import { ShareButton } from "@/features/product-detail/components/share-dialog";
import { StickySidebar } from "@/features/product-detail/components/sticky-sidebar";
import { ContentBlocks } from "@/features/product-detail/components/content-blocks";
import { StudioBanner } from "@/features/product-detail/components/studio-banner";
import { AboutSection } from "@/features/product-detail/sections/about-section";

import { consultationFaqs } from "./content/faqs";
import type { ConsultationDetailData } from "./model/types";
import { BookingCard } from "./sections/booking-card";
import { ConsultationHero } from "./sections/consultation-hero";
import { ConsultationsRail, ProgramsRail } from "./sections/consultation-rails";
import { ExpertSection } from "./sections/expert-section";
import { ConsultationJsonLd } from "./seo/json-ld";

export type ConsultationShareProps = ComponentProps<typeof ShareButton>;

/**
 * Consultation page: cover hero → (about, the expert | sticky booking card) → other consultations →
 * suggested programs → FAQ. Same frame as the course page. Pure composition over view models; only
 * the section nav, the booking button (which opens the calendar) and the share/wishlist buttons hydrate.
 * The admin Studio's live preview renders it in the browser (`preview`: no share button, no JSON-LD).
 */
export function ConsultationDetailView({
  data,
  shareProps,
  preview = false,
}: {
  data: ConsultationDetailData;
  shareProps?: ConsultationShareProps | null;
  preview?: boolean;
}) {
  const { consultation, relatedConsultations, programs } = data;
  const { expert } = consultation;
  const heroShare = shareProps ? <ShareButton {...shareProps} /> : undefined;
  const cardShare = shareProps ? <ShareButton {...shareProps} variant="block" /> : undefined;

  const hasStudioContent = Boolean(consultation.content && consultation.content.length > 0);
  // A studio page's headings become the nav, exactly like the course page.
  const contentNavItems: SectionNavItem[] = (consultation.content ?? [])
    .filter((section) => section.heading)
    .map((section) => ({ id: section.id, label: section.heading as string }));

  const nav: SectionNavItem[] = [
    ...(contentNavItems.length > 0
      ? contentNavItems
      : (consultation.sections.length > 0 || consultation.readme)
        ? [{ id: "about", label: "عن الاستشارة" }]
        : []),
    expert ? { id: "instructor", label: "الخبير" } : null,
    relatedConsultations.length > 0 ? { id: "related", label: "استشارات أخرى" } : null,
    { id: "faq", label: "الأسئلة الشائعة" },
  ].filter((item) => item !== null);

  return (
    <>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="outline-none">
        <ConsultationHero consultation={consultation} share={heroShare} />

        <div className="mt-10">
          <SectionNav items={nav} />
        </div>

        <div className="ma-container grid gap-12 py-12 md:py-16 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-16">
          <div className="flex min-w-0 flex-col gap-16">
            {/* Above the content on phones, beside it from `lg`. */}
            <div className="lg:hidden">
              <BookingCard consultation={consultation} share={cardShare} />
            </div>
            {consultation.banner ? <StudioBanner banner={consultation.banner} /> : null}
            {hasStudioContent && consultation.content ? (
              <ContentBlocks sections={consultation.content} />
            ) : (
              <AboutSection sections={consultation.sections} readme={consultation.readme} title="عن الاستشارة" />
            )}
            <ExpertSection expert={expert} />
          </div>
          <StickySidebar>
            <BookingCard consultation={consultation} share={cardShare} />
          </StickySidebar>
        </div>

        <ConsultationsRail cards={relatedConsultations} />
        <ProgramsRail cards={programs} expertName={expert?.name ?? null} />
        <FaqSection faqs={consultationFaqs} title="أسئلة شائعة عن الاستشارات" />
        <CtaBand />
      </main>
      <SiteFooter />
      {preview ? null : <ConsultationJsonLd consultation={consultation} faqs={consultationFaqs} />}
    </>
  );
}
