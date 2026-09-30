import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getSiteUrl } from "@/config/env";
import { CtaBand } from "@/features/landing/sections/cta-band";
import { FaqSection } from "@/features/landing/sections/faq-section";
import { toQrMatrix } from "@/features/product-detail/api/share-qr";
import { SectionNav, type SectionNavItem } from "@/features/product-detail/components/section-nav";
import { ShareButton } from "@/features/product-detail/components/share-dialog";
import { StickySidebar } from "@/features/product-detail/components/sticky-sidebar";
import { AboutSection } from "@/features/product-detail/sections/about-section";

import { consultationFaqs } from "./content/faqs";
import { consultationFacts } from "./model/facts";
import type { ConsultationDetailData } from "./model/types";
import { BookingCard } from "./sections/booking-card";
import { ConsultationHero } from "./sections/consultation-hero";
import { ConsultationsRail, ProgramsRail } from "./sections/consultation-rails";
import { ExpertSection } from "./sections/expert-section";
import { ConsultationJsonLd } from "./seo/json-ld";

/**
 * Consultation page: cover hero → (about, the expert | sticky booking card) → other consultations →
 * suggested programs → FAQ. Same frame as the course page. Pure composition over view models; only
 * the section nav, the booking button (which opens the calendar) and the share/wishlist buttons hydrate.
 */
export function ConsultationDetailPage({ data }: { data: ConsultationDetailData }) {
  const { consultation, relatedConsultations, programs } = data;
  const { expert } = consultation;
  const shareUrl = `${getSiteUrl()}${consultation.href}`;
  const shareProps = {
    url: shareUrl,
    title: consultation.title,
    kindLabel: "استشارة",
    tagClassName: "ma-tag--lilac",
    facts: consultationFacts(consultation).map((fact) => fact.label),
    trainers: expert ? [{ name: expert.name, avatar: expert.avatar, initial: expert.initial }] : [],
    personLabels: ["الخبير", "الخبراء"] as const,
    // Scans are tagged so they can be told apart from other visits in analytics.
    qr: toQrMatrix(`${shareUrl}?utm_source=qr&utm_medium=share`),
    fileName: `consultation-${consultation.id}`,
  };

  const nav: SectionNavItem[] = [
    consultation.sections.length > 0 ? { id: "about", label: "عن الاستشارة" } : null,
    expert ? { id: "instructor", label: "الخبير" } : null,
    relatedConsultations.length > 0 ? { id: "related", label: "استشارات أخرى" } : null,
    { id: "faq", label: "الأسئلة الشائعة" },
  ].filter((item) => item !== null);

  return (
    <>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="outline-none">
        <ConsultationHero consultation={consultation} share={<ShareButton {...shareProps} />} />

        <div className="mt-10">
          <SectionNav items={nav} />
        </div>

        <div className="ma-container grid gap-12 py-12 md:py-16 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-16">
          <div className="flex min-w-0 flex-col gap-16">
            {/* Above the content on phones, beside it from `lg`. */}
            <div className="lg:hidden">
              <BookingCard consultation={consultation} share={<ShareButton {...shareProps} variant="block" />} />
            </div>
            <AboutSection sections={consultation.sections} title="عن الاستشارة" />
            <ExpertSection expert={expert} />
          </div>
          <StickySidebar>
            <BookingCard consultation={consultation} share={<ShareButton {...shareProps} variant="block" />} />
          </StickySidebar>
        </div>

        <ConsultationsRail cards={relatedConsultations} />
        <ProgramsRail cards={programs} expertName={expert?.name ?? null} />
        <FaqSection faqs={consultationFaqs} title="أسئلة شائعة عن الاستشارات" />
        <CtaBand />
      </main>
      <SiteFooter />
      <ConsultationJsonLd consultation={consultation} faqs={consultationFaqs} />
    </>
  );
}
