import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { LiveSpotlight } from "@/features/live-training/sections/live-spotlight";

import { fallbackFaqs } from "./content/faqs";
import { MAX_CARDS } from "./model/mappers";
import type { LandingData } from "./model/types";
import { AboutSection } from "./sections/about-section";
import { AnnouncementBar } from "./sections/announcement-bar";
import { BusinessSection } from "./sections/business-section";
import { ConsultationsSection, CoursesSection, DiplomasSection, PackagesSection } from "./sections/catalog-sections";
import { CtaBand } from "./sections/cta-band";
import { ExpertsSection } from "./sections/experts-section";
import { ExpertsTicker } from "./sections/experts-ticker";
import { FaqSection } from "./sections/faq-section";
import { HeroSection } from "./sections/hero-section";
import { OfferingsSection } from "./sections/offerings-section";
import { StatsSection } from "./sections/stats-section";
import { TestimonialsSection } from "./sections/testimonials-section";
import { LandingJsonLd } from "./seo/json-ld";

/**
 * Pure composition: sections are fed by view models. The catalog rails are client components so
 * their filter chips work without a round trip; everything else renders on the server.
 */
export function LandingPage({ data }: { data: LandingData }) {
  const faqs = data.faqs.length > 0 ? data.faqs : fallbackFaqs;
  const instructorCount = data.stats.find((stat) => stat.key === "instructors")?.value ?? null;

  return (
    <>
      <AnnouncementBar banner={data.banner} />
      <SiteHeader />
      <main id="main" tabIndex={-1} className="outline-none">
        <HeroSection />
        <LiveSpotlight training={data.liveTraining} />
        <StatsSection stats={data.stats} />
        <ExpertsTicker />
        <OfferingsSection />
        <CoursesSection courses={data.courses} total={data.coursesTotal} filters={data.courseFilters} />
        <DiplomasSection diplomas={data.diplomas} filters={data.diplomaFilters} />
        <PackagesSection packages={data.packages} filters={data.packageFilters} />
        <ConsultationsSection consultations={data.consultations} filters={data.consultationFilters} />
        <AboutSection />
        <ExpertsSection instructorCount={instructorCount} />
        <BusinessSection />
        <TestimonialsSection />
        <FaqSection faqs={faqs} />
        <CtaBand />
      </main>
      <SiteFooter />
      <LandingJsonLd courses={data.courses.slice(0, MAX_CARDS)} faqs={faqs} />
    </>
  );
}
