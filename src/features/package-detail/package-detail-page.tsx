import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getSiteUrl } from "@/config/env";
import { CtaBand } from "@/features/landing/sections/cta-band";
import { FaqSection } from "@/features/landing/sections/faq-section";
import { toQrMatrix } from "@/features/product-detail/api/share-qr";
import { SectionNav, type SectionNavItem } from "@/features/product-detail/components/section-nav";
import { ShareButton } from "@/features/product-detail/components/share-dialog";
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
export function PackageDetailPage({ data }: { data: PackageDetailData }) {
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
    qr: toQrMatrix(`${shareUrl}?utm_source=qr&utm_medium=share`),
    fileName: `package-${product.id}`,
  };
  const contentsLead = [itemsLabel(product), product.duration ? `${product.duration} من المحتوى` : null]
    .filter(Boolean)
    .join(" · ");

  const nav: SectionNavItem[] = [
    product.sections.length > 0 ? { id: "about", label: "عن الباقة" } : null,
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
            <AboutSection sections={product.sections} title="عن الباقة" />
            <PackageContentsSection items={product.items} title="محتوى الباقة" lead={contentsLead || null} />
            <InstructorSection trainers={product.trainers} />
          </div>
          <div className="hidden lg:block">
            <div className="sticky top-[calc(var(--header-h)+5rem)]">
              <PackagePurchaseCard product={product} share={<ShareButton {...shareProps} variant="block" />} />
            </div>
          </div>
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
