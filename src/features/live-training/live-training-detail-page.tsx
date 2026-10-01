import { FileText } from "lucide-react";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { FaqSection } from "@/features/landing/sections/faq-section";
import { SectionNav, type SectionNavItem } from "@/features/product-detail/components/section-nav";
import { StickySidebar } from "@/features/product-detail/components/sticky-sidebar";

import { detailCopy } from "./content/copy";
import type { LiveTrainingDetailVM } from "./model/types";
import { BookingCard } from "./sections/booking-card";
import {
  AboutBlock,
  ActivitiesBlock,
  AudienceBlock,
  AxesBlock,
  CertificatesSection,
  InstructorBlock,
  MethodBlock,
  ObjectivesBlock,
} from "./sections/detail-sections";
import { LiveSpotlight } from "./sections/live-spotlight";
import { RegisterBand } from "./sections/register-band";
import { LiveTrainingJsonLd } from "./seo/json-ld";

/**
 * `/live/{slug}`: cinematic hero → (about, objectives, audience, axes, activities, method, trainer |
 * sticky booking card) → certificates → FAQ → register band. Same frame as the course page, so the
 * section nav and sticky card behave identically.
 */
export function LiveTrainingDetailPage({ training }: { training: LiveTrainingDetailVM }) {
  const { details } = training;
  const nav: SectionNavItem[] = [
    { id: "about", label: detailCopy.nav.about },
    details.objectives.length > 0 ? { id: "objectives", label: detailCopy.nav.objectives } : null,
    details.audience.items.length > 0 ? { id: "audience", label: detailCopy.nav.audience } : null,
    details.axes.items.length > 0 ? { id: "curriculum", label: detailCopy.nav.curriculum } : null,
    details.method.length > 0 ? { id: "method", label: detailCopy.nav.method } : null,
    { id: "instructor", label: detailCopy.nav.instructor },
    details.certificates.length > 0 || details.features.length > 0
      ? { id: "certificate", label: detailCopy.nav.certificate }
      : null,
    details.faqs.length > 0 ? { id: "faq", label: detailCopy.nav.faq } : null,
  ].filter((item) => item !== null);

  return (
    <>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="outline-none">
        <LiveSpotlight
          training={training}
          variant="detail"
          actions={
            training.brochureUrl ? (
              <a
                href={training.brochureUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ma-btn ma-btn--ghost ma-btn--lg"
              >
                <FileText aria-hidden="true" className="size-4" />
                {detailCopy.brochure}
              </a>
            ) : null
          }
        />

        <div className="mt-10">
          <SectionNav items={nav} />
        </div>

        <div className="ma-container grid gap-12 py-12 md:py-16 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-16">
          <div className="flex min-w-0 flex-col gap-16">
            {/* Below the hero on phones, beside the content from `lg`. */}
            <div className="lg:hidden">
              <BookingCard training={training} />
            </div>
            <AboutBlock about={details.about} summary={training.summary} />
            <ObjectivesBlock objectives={details.objectives} />
            <AudienceBlock audience={details.audience} />
            <AxesBlock axes={details.axes} />
            <ActivitiesBlock activities={details.activities} />
            <MethodBlock method={details.method} />
            <InstructorBlock training={training} />
          </div>
          <StickySidebar>
            <BookingCard training={training} />
          </StickySidebar>
        </div>

        <CertificatesSection details={details} />
        <FaqSection faqs={details.faqs} title={detailCopy.faqTitle} />
        <RegisterBand training={training} />
      </main>
      <SiteFooter />
      <LiveTrainingJsonLd training={training} />
    </>
  );
}
