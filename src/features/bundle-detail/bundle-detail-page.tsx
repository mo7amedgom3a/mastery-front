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
import { CertificateSection } from "@/features/product-detail/sections/certificate-section";
import { InstructorSection } from "@/features/product-detail/sections/instructor-section";

import { bundleFaqs } from "./content/faqs";
import { compositionLabel } from "./model/mappers";
import type { BundleDetailVM } from "./model/types";
import { BundleHero, bundleFacts } from "./sections/bundle-hero";
import { BundleMembersSection } from "./sections/bundle-members-section";
import { BundlePurchaseCard } from "./sections/bundle-purchase-card";
import { BundleJsonLd } from "./seo/json-ld";

/**
 * Bundle page: hero → (about and outcomes, skills, members by kind, trainers | sticky purchase card)
 * → certificates → FAQ. Same frame as the package page; every member links to its own page. Pure
 * composition over view models; only the section nav and share dialog hydrate.
 */
export function BundleDetailPage({ bundle }: { bundle: BundleDetailVM }) {
  const shareUrl = `${getSiteUrl()}${bundle.href}`;
  const shareProps = {
    url: shareUrl,
    title: bundle.title,
    kindLabel: "حزمة",
    tagClassName: "ma-tag--sky",
    facts: bundleFacts(bundle).map((fact) => fact.label),
    trainers: bundle.trainers.map(({ name, avatar, initial }) => ({ name, avatar, initial })),
    // Scans are tagged so they can be told apart from other visits in analytics.
    qr: toQrMatrix(`${shareUrl}?utm_source=qr&utm_medium=share`),
    fileName: `bundle-${bundle.slug}`,
  };

  const nav: SectionNavItem[] = [
    bundle.sections.length > 0 ? { id: "about", label: "عن الحزمة" } : null,
    bundle.members.length > 0 ? { id: "contents", label: "محتوى الحزمة" } : null,
    bundle.trainers.length > 0 ? { id: "instructor", label: "المدربون" } : null,
    { id: "certificate", label: "الشهادة" },
    { id: "faq", label: "الأسئلة الشائعة" },
  ].filter((item) => item !== null);

  return (
    <>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="outline-none">
        <BundleHero bundle={bundle} share={<ShareButton {...shareProps} />} />

        <div className="mt-10">
          <SectionNav items={nav} />
        </div>

        <div className="ma-container grid gap-12 py-12 md:py-16 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-16">
          <div className="flex min-w-0 flex-col gap-16">
            {/* Above the content on phones, beside it from `lg`. */}
            <div className="lg:hidden">
              <BundlePurchaseCard bundle={bundle} share={<ShareButton {...shareProps} variant="block" />} />
            </div>
            <AboutSection sections={bundle.sections} title="عن الحزمة" />
            {bundle.skills.length > 0 ? (
              <section aria-labelledby="skills-title">
                <h2 id="skills-title" className="m-0 text-2xl font-bold">
                  المهارات التي تبنيها
                </h2>
                <ul className="m-0 mt-5 flex list-none flex-wrap gap-2 p-0">
                  {bundle.skills.map((skill) => (
                    <li key={skill} className="ma-tag ma-tag--soft">
                      {skill}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
            <BundleMembersSection groups={bundle.groups} lead={compositionLabel(bundle.composition)} />
            <InstructorSection trainers={bundle.trainers} />
          </div>
          <StickySidebar>
            <BundlePurchaseCard bundle={bundle} share={<ShareButton {...shareProps} variant="block" />} />
          </StickySidebar>
        </div>

        <CertificateSection />
        <FaqSection faqs={bundleFaqs} title="أسئلة شائعة عن حزم ماستري" />
        <CtaBand />
      </main>
      <SiteFooter />
      <BundleJsonLd bundle={bundle} faqs={bundleFaqs} />
    </>
  );
}
