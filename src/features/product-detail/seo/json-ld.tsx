import { getSiteUrl } from "@/config/env";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";
import type { FaqVM } from "@/features/landing/model/types";

import { kindListLabel } from "../content/copy";
import type { ProductDetailVM } from "../model/types";

/** Escapes `<` so user-controlled strings can never close the script tag. */
function serialize(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/** Course (with its instructors, offer and online instance), breadcrumb trail and FAQ. */
export function ProductJsonLd({ product, faqs }: { product: ProductDetailVM; faqs: readonly FaqVM[] }) {
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}${product.href}`;
  const listHref = product.kind === "diploma" ? routes.diplomas : routes.courses;
  const instructors = product.trainers.map((trainer) => ({
    "@type": "Person",
    name: trainer.name,
    url: `${siteUrl}${trainer.href}`,
    ...(trainer.avatar ? { image: trainer.avatar } : {}),
    ...(trainer.summary ? { description: trainer.summary } : {}),
  }));

  const graph: Record<string, unknown>[] = [
    {
      "@type": "Course",
      "@id": `${url}#course`,
      name: product.title,
      url,
      description: product.description ?? product.summary ?? product.title,
      ...(product.image ? { image: product.image } : {}),
      inLanguage: "ar",
      ...(product.category ? { about: product.category } : {}),
      provider: { "@type": "EducationalOrganization", name: siteConfig.name, url: siteUrl },
      ...(instructors.length > 0 ? { instructor: instructors } : {}),
      ...(product.priceAmount || product.price.free
        ? {
            offers: {
              "@type": "Offer",
              url,
              price: product.priceAmount ?? 0,
              priceCurrency: siteConfig.currency,
              category: product.price.free ? "Free" : "Paid",
              availability: "https://schema.org/InStock",
            },
          }
        : {}),
      hasCourseInstance: {
        "@type": "CourseInstance",
        courseMode: "Online",
        ...(instructors.length > 0 ? { instructor: instructors } : {}),
      },
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "الرئيسية", item: `${siteUrl}/` },
        { "@type": "ListItem", position: 2, name: kindListLabel[product.kind], item: `${siteUrl}${listHref}` },
        { "@type": "ListItem", position: 3, name: product.title, item: url },
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
