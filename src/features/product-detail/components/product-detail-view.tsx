"use client";

import Image from "next/image";
import { useEffect } from "react";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { CtaBand } from "@/features/landing/sections/cta-band";
import { FaqSection } from "@/features/landing/sections/faq-section";

import { ContentBlocks } from "./content-blocks";
import { IntroVideo } from "./intro-video";
import { SectionNav, type SectionNavItem } from "./section-nav";
import { ShareButton } from "./share-dialog";
import { StickySidebar } from "./sticky-sidebar";
import { StudioBanner } from "./studio-banner";
import { kindLabel } from "../content/copy";
import { productFaqs } from "../content/faqs";
import type { ProductDetailData } from "../model/types";
import { AboutSection } from "../sections/about-section";
import { CertificateSection } from "../sections/certificate-section";
import { CurriculumSection } from "../sections/curriculum-section";
import { DetailHero } from "../sections/detail-hero";
import { InstructorSection } from "../sections/instructor-section";
import { RecommendedRail, RelatedRail } from "../sections/product-rails";
import { PurchaseCard } from "../sections/purchase-card";
import { ProductJsonLd } from "../seo/json-ld";

export type ShareProps = {
  url: string;
  title: string;
  kindLabel: string;
  tagClassName: string;
  facts: string[];
  trainers: { name: string; avatar: string | null; initial: string }[];
  qr: { size: number; cells: string };
  fileName: string;
};

export function ProductDetailView({
  data,
  shareProps,
  preview = false,
}: {
  data: ProductDetailData;
  shareProps?: ShareProps | null;
  preview?: boolean;
}) {
  const { product, related, recommended } = data;
  const noun = kindLabel[product.kind];
  const faqs = productFaqs(product.kind);

  // In preview mode inside an iframe, listen for scroll messages from the studio outline
  useEffect(() => {
    if (!preview) return;
    const onMessage = (event: MessageEvent) => {
      if (
        event.data?.source === "mastery-studio" &&
        event.data?.type === "scroll" &&
        event.data?.blockId
      ) {
        const id = String(event.data.blockId);
        const target =
          document.querySelector(`[data-block-id="${id}"]`) ||
          document.getElementById(`s-${id}`) ||
          document.getElementById(id);
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [preview]);

  const hasStudioContent = Boolean(product.content && product.content.length > 0);

  // Derive nav items: if studio content exists, map each H2 section
  const contentNavItems: SectionNavItem[] = (product.content ?? [])
    .filter((s) => s.heading)
    .map((s) => ({ id: s.id, label: s.heading! }));

  const nav: SectionNavItem[] = [
    ...(contentNavItems.length > 0
      ? contentNavItems
      : (product.sections.length > 0 || product.readme)
        ? [{ id: "about", label: `عن ال${noun}` }]
        : []),
    product.curriculum.length > 0 ? { id: "curriculum", label: `محتوى ال${noun}` } : null,
    product.trainers.length > 0 ? { id: "instructor", label: "المدرب" } : null,
    { id: "certificate", label: "الشهادة" },
    { id: "faq", label: "الأسئلة الشائعة" },
  ].filter((item): item is SectionNavItem => item !== null);

  const heroShare = shareProps ? <ShareButton {...shareProps} /> : undefined;
  const cardShare = shareProps ? <ShareButton {...shareProps} variant="block" /> : undefined;

  return (
    <>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="outline-none">
        <DetailHero product={product} share={heroShare} />

        <div className="mt-10">
          <SectionNav items={nav} />
        </div>

        <div className="ma-container grid gap-12 py-12 md:py-16 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-16">
          <div className="flex min-w-0 flex-col gap-16">
            {product.banner ? <StudioBanner banner={product.banner} /> : null}

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
              <PurchaseCard product={product} share={cardShare} preview={preview} />
            </div>

            {hasStudioContent && product.content ? (
              <ContentBlocks sections={product.content} />
            ) : (
              <AboutSection sections={product.sections} readme={product.readme} title={`عن ال${noun}`} />
            )}

            <CurriculumSection units={product.curriculum} title={`محتوى ال${noun}`} />
            <InstructorSection trainers={product.trainers} />
          </div>

          <StickySidebar>
            <PurchaseCard product={product} share={cardShare} preview={preview} />
          </StickySidebar>
        </div>

        <CertificateSection />
        <RelatedRail cards={related} />
        <RecommendedRail cards={recommended} />
        <FaqSection faqs={faqs} title={`أسئلة شائعة عن ال${noun}`} />
        <CtaBand />
      </main>
      <SiteFooter />
      {!preview ? <ProductJsonLd product={product} faqs={faqs} /> : null}
    </>
  );
}
