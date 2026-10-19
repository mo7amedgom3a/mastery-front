import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getSiteUrl } from "@/config/env";
import { CtaBand } from "@/features/landing/sections/cta-band";
import { FaqSection } from "@/features/landing/sections/faq-section";
import type { QrMatrix } from "@/features/product-detail/model/qr";import { SectionNav, type SectionNavItem } from "@/features/product-detail/components/section-nav";
import { ShareButton } from "@/features/product-detail/components/share-dialog";
import { StickySidebar } from "@/features/product-detail/components/sticky-sidebar";
import { ContentBlocks } from "@/features/product-detail/components/content-blocks";
import { StudioBanner } from "@/features/product-detail/components/studio-banner";
import { AboutSection } from "@/features/product-detail/sections/about-section";
import { CertificateSection } from "@/features/product-detail/sections/certificate-section";
import { InstructorSection } from "@/features/product-detail/sections/instructor-section";
import { RecommendedRail, RelatedRail } from "@/features/product-detail/sections/product-rails";

import { packageFaqs } from "./content/faqs";
import { itemsLabel, packageFacts } from "./model/facts";
import type { PackageDetailData } from "./model/types";
import { PackageContentsSection } from "./sections/package-contents-section";
import { PackageHero } from "./sections/package-hero";
import { PackagePurchaseCard } from "./sections/package-purchase-card";
import { PackageJsonLd } from "./seo/json-ld";

/**
 * Package page: hero → (about, the courses inside it, trainers | sticky purchase card) → certificates
 * → related → recommended → FAQ. Same frame as the course page; every included course links to its
 * own page. Pure composition over view models; only the section nav and cart buttons hydrate.
 */
export function PackageDetailPage({ data, qrMatrix }: { data: PackageDetailData; qrMatrix: QrMatrix }) {
  const { product, related, recommended } = data;
  const shareUrl = `${getSiteUrl()}${product.href}`;
  const shareProps = {
    url: shareUrl,
    title: product.title,
    kindLabel: "باقة",
    tagClassName: "ma-tag--green",
    facts: packageFacts(product).map((fact) => fact.label),
    trainers: product.trainers.map(({ name, avatar, initial }) => ({ name, avatar, initial })),
    // Scans are tagged so they can be told apart from other visits in analytics.
    qr: qrMatrix,
    fileName: `package-${product.id}`,
  };
  const contentsLead = [itemsLabel(product), product.duration ? `${product.duration} من المحتوى` : null]
    .filter(Boolean)
    .join(" · ");

  const hasStudioContent = Boolean(product.content && product.content.length > 0);
  // A studio page's headings become the nav, exactly like the course page.
  const contentNavItems: SectionNavItem[] = (product.content ?? [])
    .filter((section) => section.heading)
    .map((section) => ({ id: section.id, label: section.heading as string }));

  const nav: SectionNavItem[] = [
    ...(contentNavItems.length > 0
      ? contentNavItems
      : (product.sections.length > 0 || product.readme)
        ? [{ id: "about", label: "عن الباقة" }]
        : []),
    product.items.length > 0 ? { id: "contents", label: "محتوى الباقة" } : null,
    product.trainers.length > 0 ? { id: "instructor", label: "المدربون" } : null,
    { id: "certificate", label: "الشهادة" },
    { id: "faq", label: "الأسئلة الشائعة" },
  ].filter((item) => item !== null);

  return (
    <>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="outline-none">
        <PackageHero product={product} share={<ShareButton {...shareProps} />} />

        <div className="mt-10">
          <SectionNav items={nav} />
        </div>

        <div className="ma-container grid gap-12 py-12 md:py-16 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-16">
          <div className="flex min-w-0 flex-col gap-16">
            {/* Above the content on phones, beside it from `lg`. */}
            <div className="lg:hidden">
              <PackagePurchaseCard product={product} share={<ShareButton {...shareProps} variant="block" />} />
            </div>
            {product.banner ? <StudioBanner banner={product.banner} /> : null}
            {hasStudioContent && product.content ? (
              <ContentBlocks sections={product.content} />
            ) : (
              <AboutSection sections={product.sections} readme={product.readme} title="عن الباقة" />
            )}
            <PackageContentsSection items={product.items} title="محتوى الباقة" lead={contentsLead || null} />
            <InstructorSection trainers={product.trainers} />
          </div>
          <StickySidebar>
            <PackagePurchaseCard product={product} share={<ShareButton {...shareProps} variant="block" />} />
          </StickySidebar>
        </div>

        <CertificateSection />
        <RelatedRail cards={related} />
        <RecommendedRail cards={recommended} />
        <FaqSection faqs={packageFaqs} title="أسئلة شائعة عن الباقات" />
        <CtaBand />
      </main>
      <SiteFooter />
      <PackageJsonLd product={product} faqs={packageFaqs} />
    </>
  );
}
