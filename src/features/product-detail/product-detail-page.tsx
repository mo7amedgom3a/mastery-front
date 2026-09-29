import Image from "next/image";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getSiteUrl } from "@/config/env";
import { CtaBand } from "@/features/landing/sections/cta-band";
import { FaqSection } from "@/features/landing/sections/faq-section";

import { toQrMatrix } from "./api/share-qr";
import { IntroVideo } from "./components/intro-video";
import { SectionNav, type SectionNavItem } from "./components/section-nav";
import { ShareButton } from "./components/share-dialog";
import { kindLabel } from "./content/copy";
import { productFaqs } from "./content/faqs";
import { productFacts } from "./model/facts";
import type { ProductDetailData } from "./model/types";
import { AboutSection } from "./sections/about-section";
import { CertificateSection } from "./sections/certificate-section";
import { CurriculumSection } from "./sections/curriculum-section";
import { DetailHero } from "./sections/detail-hero";
import { InstructorSection } from "./sections/instructor-section";
import { RecommendedRail, RelatedRail } from "./sections/product-rails";
import { PurchaseCard } from "./sections/purchase-card";
import { ProductJsonLd } from "./seo/json-ld";

/**
 * Course/diploma page: cover hero → (intro video, about, curriculum, trainer | sticky purchase card)
 * → certificates → related → recommended → FAQ. Pure composition over view models; only the video,
 * the section nav and the cart buttons hydrate.
 */
export function ProductDetailPage({ data }: { data: ProductDetailData }) {
  const { product, related, recommended } = data;
  const noun = kindLabel[product.kind];
  const faqs = productFaqs(product.kind);
  const shareUrl = `${getSiteUrl()}${product.href}`;
  const shareProps = {
    url: shareUrl,
    title: product.title,
    kindLabel: noun,
    tagClassName: product.kind === "diploma" ? "ma-tag--yellow" : "ma-tag--coral",
    facts: productFacts(product).map((fact) => fact.label),
    trainers: product.trainers.map(({ name, avatar, initial }) => ({ name, avatar, initial })),
    // Scans are tagged so they can be told apart from other visits in analytics.
    qr: toQrMatrix(`${shareUrl}?utm_source=qr&utm_medium=share`),
    fileName: `${product.kind}-${product.id}`,
  };

  const nav: SectionNavItem[] = [
    product.sections.length > 0 ? { id: "about", label: `عن ال${noun}` } : null,
    product.curriculum.length > 0 ? { id: "curriculum", label: `محتوى ال${noun}` } : null,
    product.trainers.length > 0 ? { id: "instructor", label: "المدرب" } : null,
    { id: "certificate", label: "الشهادة" },
    { id: "faq", label: "الأسئلة الشائعة" },
  ].filter((item) => item !== null);

  return (
    <>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="outline-none">
        <DetailHero product={product} share={<ShareButton {...shareProps} />} />

        <div className="mt-10">
          <SectionNav items={nav} />
        </div>

        <div className="ma-container grid gap-12 py-12 md:py-16 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-16">
          <div className="flex min-w-0 flex-col gap-16">
            {product.introVideo ? (
              <IntroVideo
                embedUrl={product.introVideo.embedUrl}
                title={product.introVideo.title}
                duration={product.introVideo.duration}
                poster={
                  <Image
                    src={product.introVideo.poster}
                    alt=""
                    fill
                    sizes="(min-width: 1200px) 760px, (min-width: 1024px) 60vw, 100vw"
                    className="object-cover"
                  />
                }
              />
            ) : null}
            {/* Below the video on phones, beside the content from `lg`. */}
            <div className="lg:hidden">
              <PurchaseCard product={product} share={<ShareButton {...shareProps} variant="block" />} />
            </div>
            <AboutSection sections={product.sections} title={`عن ال${noun}`} />
            <CurriculumSection units={product.curriculum} title={`محتوى ال${noun}`} />
            <InstructorSection trainers={product.trainers} />
          </div>
          <div className="hidden lg:block">
            <div className="sticky top-[calc(var(--header-h)+5rem)]">
              <PurchaseCard product={product} share={<ShareButton {...shareProps} variant="block" />} />
            </div>
          </div>
        </div>

        <CertificateSection />
        <RelatedRail cards={related} />
        <RecommendedRail cards={recommended} />
        <FaqSection faqs={faqs} title={`أسئلة شائعة عن ال${noun}`} />
        <CtaBand />
      </main>
      <SiteFooter />
      <ProductJsonLd product={product} faqs={faqs} />
    </>
  );
}
