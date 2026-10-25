import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getSiteUrl } from "@/config/env";
import { CtaBand } from "@/features/landing/sections/cta-band";
import { FaqSection } from "@/features/landing/sections/faq-section";
import type { QrMatrix } from "@/features/product-detail/model/qr";
import { SectionNav, type SectionNavItem } from "@/features/product-detail/components/section-nav";
import { ShareButton } from "@/features/product-detail/components/share-dialog";
import { StickySidebar } from "@/features/product-detail/components/sticky-sidebar";
import { ContentBlocks } from "@/features/product-detail/components/content-blocks";
import { StudioBanner } from "@/features/product-detail/components/studio-banner";
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
export function BundleDetailPage({ bundle, qr }: { bundle: BundleDetailVM; qr: QrMatrix | null }) {
  const shareUrl = `${getSiteUrl()}${bundle.href}`;
  const shareProps = qr ? {
    url: shareUrl,
    title: bundle.title,
    kindLabel: "حزمة",
    tagClassName: "ma-tag--sky",
    facts: bundleFacts(bundle).map((fact) => fact.label),
    trainers: bundle.trainers.map(({ name, avatar, initial }) => ({ name, avatar, initial })),
    // Scans are tagged so they can be told apart from other visits in analytics.
    qr,
    fileName: `bundle-${bundle.slug}`,
  } : null;

  const hasStudioContent = Boolean(bundle.content && bundle.content.length > 0);
  // A studio page's headings become the nav, exactly like the course page.
  const contentNavItems: SectionNavItem[] = (bundle.content ?? [])
    .filter((section) => section.heading)
    .map((section) => ({ id: section.id, label: section.heading as string }));

  const nav: SectionNavItem[] = [
    ...(contentNavItems.length > 0
      ? contentNavItems
      : (bundle.sections.length > 0 || bundle.readme)
        ? [{ id: "about", label: "عن الحزمة" }]
        : []),
    bundle.members.length > 0 ? { id: "contents", label: "محتوى الحزمة" } : null,
    bundle.trainers.length > 0 ? { id: "instructor", label: "المدربون" } : null,
    { id: "certificate", label: "الشهادة" },
    { id: "faq", label: "الأسئلة الشائعة" },
  ].filter((item) => item !== null);

  return (
    <>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="outline-none">
        <BundleHero bundle={bundle} share={shareProps ? <ShareButton {...shareProps} /> : null} />

        <div className="mt-10">
          <SectionNav items={nav} />
        </div>

        <div className="ma-container grid gap-12 py-12 md:py-16 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-16">
          <div className="flex min-w-0 flex-col gap-16">
            {/* Above the content on phones, beside it from `lg`. */}
            <div className="lg:hidden">
              <BundlePurchaseCard bundle={bundle} share={shareProps ? <ShareButton {...shareProps} variant="block" /> : null} />
            </div>
            {bundle.banner ? <StudioBanner banner={bundle.banner} /> : null}
            {hasStudioContent && bundle.content ? (
              <ContentBlocks sections={bundle.content} />
            ) : (
              <AboutSection sections={bundle.sections} readme={bundle.readme} title="عن الحزمة" />
            )}
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
            <BundlePurchaseCard bundle={bundle} share={shareProps ? <ShareButton {...shareProps} variant="block" /> : null} />
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
