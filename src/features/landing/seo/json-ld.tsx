import { getSiteUrl } from "@/config/env";
import { siteConfig } from "@/config/site";

import type { LiveTrainingVM } from "@/features/live-training/model/types";

import type { CourseCardVM, FaqVM } from "../model/types";

type JsonLdProps = {
  courses: CourseCardVM[];
  faqs: readonly FaqVM[];
  /** The spotlight's live training: a course with a dated online instance. */
  liveTraining?: LiveTrainingVM | null;
};

/** Escapes `<` so user-controlled strings can never close the script tag. */
function serialize(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function LandingJsonLd({ courses, faqs, liveTraining }: JsonLdProps) {
  const siteUrl = getSiteUrl();
  const organizationId = `${siteUrl}/#organization`;
  const websiteId = `${siteUrl}/#website`;

  const graph: Record<string, unknown>[] = [
    {
      "@type": "EducationalOrganization",
      "@id": organizationId,
      name: siteConfig.name,
      alternateName: siteConfig.nameEn,
      url: siteUrl,
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}${siteConfig.logo.url}`,
        width: siteConfig.logo.width,
        height: siteConfig.logo.height,
      },
      description: siteConfig.description,
      foundingDate: String(siteConfig.foundingYear),
      founder: siteConfig.founders.map((name) => ({ "@type": "Person", name })),
      inLanguage: "ar",
      ...(siteConfig.social.length > 0 ? { sameAs: siteConfig.social } : {}),
    },
    {
      "@type": "WebSite",
      "@id": websiteId,
      url: siteUrl,
      name: siteConfig.name,
      alternateName: siteConfig.nameEn,
      inLanguage: "ar",
      publisher: { "@id": organizationId },
    },
    {
      "@type": "WebPage",
      "@id": `${siteUrl}/#webpage`,
      url: `${siteUrl}/`,
      name: siteConfig.title,
      description: siteConfig.description,
      inLanguage: "ar",
      isPartOf: { "@id": websiteId },
      about: { "@id": organizationId },
      primaryImageOfPage: { "@type": "ImageObject", url: `${siteUrl}/opengraph-image.jpg` },
    },
  ];

  if (courses.length > 0) {
    graph.push({
      "@type": "ItemList",
      name: "دورات مختارة",
      itemListElement: courses.map((course, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "Course",
          name: course.title,
          url: `${siteUrl}${course.href}`,
          ...(course.summary ? { description: course.summary } : {}),
          ...(course.image ? { image: course.image } : {}),
          inLanguage: "ar",
          provider: { "@id": organizationId },
          ...(course.priceAmount || course.price.free
            ? {
                offers: {
                  "@type": "Offer",
                  price: course.priceAmount ?? 0,
                  priceCurrency: siteConfig.currency,
                  category: course.price.free ? "Free" : "Paid",
                },
              }
            : {}),
        },
      })),
    });
  }

  if (liveTraining) {
    const url = `${siteUrl}${liveTraining.href}`;
    const instructor = { "@type": "Person", name: liveTraining.trainerName };
    graph.push({
      "@type": "Course",
      "@id": `${url}#course`,
      name: liveTraining.title,
      url,
      description: liveTraining.summary ?? liveTraining.subtitle ?? liveTraining.title,
      ...(liveTraining.coverImage ? { image: liveTraining.coverImage } : {}),
      inLanguage: "ar",
      provider: { "@id": organizationId },
      instructor,
      offers: {
        "@type": "Offer",
        url,
        price: liveTraining.priceAmount,
        priceCurrency: siteConfig.currency,
        category: "Paid",
      },
      hasCourseInstance: {
        "@type": "CourseInstance",
        courseMode: "Online",
        startDate: liveTraining.startsAt,
        endDate: liveTraining.endsAt,
        instructor,
      },
    });
  }

  if (faqs.length > 0) {
    graph.push({
      "@type": "FAQPage",
      mainEntity: faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: { "@type": "Answer", text: faq.answer },
      })),
    });
  }

  return (
    <script
      type="application/ld+json"
      // Safe: static structure, JSON-serialised and `<`-escaped above.
      dangerouslySetInnerHTML={{ __html: serialize({ "@context": "https://schema.org", "@graph": graph }) }}
    />
  );
}
