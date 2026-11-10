import { getSiteUrl } from "@/config/env";
import { siteConfig } from "@/config/site";
import type { LiveTrainingVM } from "@/features/live-training/model/types";
import { JsonLd, faqPage, organizationRef, webPage } from "@/lib/seo/json-ld";

import type { CourseCardVM, FaqVM } from "../model/types";

type JsonLdProps = {
  courses: CourseCardVM[];
  faqs: readonly FaqVM[];
  /** The spotlight's live training: a course with a dated online instance. */
  liveTraining?: LiveTrainingVM | null;
};

/**
 * Homepage graph. The academy and site entities live in the root layout (`SiteJsonLd`); this page
 * only adds what is specific to it: the WebPage, the featured-course list, the live course and the
 * FAQ. Everything references the shared `@id`s.
 */
export function LandingJsonLd({ courses, faqs, liveTraining }: JsonLdProps) {
  const siteUrl = getSiteUrl();
  const home = `${siteUrl}/`;

  const graph: Record<string, unknown>[] = [
    {
      ...webPage({
        url: home,
        name: siteConfig.title,
        description: siteConfig.description,
      }),
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
          provider: organizationRef(),
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
      provider: organizationRef(),
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
    graph.push(faqPage(faqs));
  }

  return <JsonLd graph={graph} />;
}
