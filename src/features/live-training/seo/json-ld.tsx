import { getSiteUrl } from "@/config/env";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";

import { detailCopy } from "../content/copy";
import type { LiveTrainingDetailVM } from "../model/types";

/** Escapes `<` so user-controlled strings can never close the script tag. */
function serialize(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/** Course with its dated online instance and offer, breadcrumb trail and FAQ. */
export function LiveTrainingJsonLd({ training }: { training: LiveTrainingDetailVM }) {
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}${training.href}`;
  const instructor = {
    "@type": "Person",
    name: training.trainerName,
    ...(training.trainerTitle ? { jobTitle: training.trainerTitle } : {}),
  };
  const faqs = training.details.faqs;

  const graph: Record<string, unknown>[] = [
    {
      "@type": "Course",
      "@id": `${url}#course`,
      name: training.title,
      url,
      description: training.summary ?? training.subtitle ?? training.title,
      ...(training.coverImage ? { image: training.coverImage } : {}),
      inLanguage: "ar",
      provider: { "@type": "EducationalOrganization", name: siteConfig.name, url: siteUrl },
      instructor,
      offers: {
        "@type": "Offer",
        url,
        price: training.priceAmount,
        priceCurrency: siteConfig.currency,
        category: "Paid",
        availability: "https://schema.org/InStock",
      },
      hasCourseInstance: {
        "@type": "CourseInstance",
        courseMode: "Online",
        startDate: training.startsAt,
        endDate: training.endsAt,
        instructor,
      },
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "الرئيسية", item: `${siteUrl}/` },
        { "@type": "ListItem", position: 2, name: detailCopy.breadcrumb, item: `${siteUrl}${routes.live}` },
        { "@type": "ListItem", position: 3, name: training.title, item: url },
      ],
    },
  ];

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
