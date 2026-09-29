import { getSiteUrl } from "@/config/env";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";
import type { FaqVM } from "@/features/landing/model/types";

import type { PackageDetailVM } from "../model/types";

/** Escapes `<` so user-controlled strings can never close the script tag. */
function serialize(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/** The package as a Product whose parts are its courses, its breadcrumb trail and FAQ. */
export function PackageJsonLd({ product, faqs }: { product: PackageDetailVM; faqs: readonly FaqVM[] }) {
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}${product.href}`;
  const provider = { "@type": "EducationalOrganization", name: siteConfig.name, url: siteUrl };

  const graph: Record<string, unknown>[] = [
    {
      "@type": "Product",
      "@id": `${url}#package`,
      name: product.title,
      url,
      description: product.description ?? product.summary ?? product.title,
      ...(product.image ? { image: product.image } : {}),
      brand: { "@type": "Brand", name: siteConfig.name },
      ...(product.priceAmount || product.price.free
        ? {
            offers: {
              "@type": "Offer",
              url,
              price: product.priceAmount ?? 0,
              priceCurrency: siteConfig.currency,
              availability: "https://schema.org/InStock",
            },
          }
        : {}),
      hasPart: product.items.map((item) => ({
        "@type": "Course",
        name: item.title,
        ...(item.href ? { url: `${siteUrl}${item.href}` } : {}),
        ...(item.summary ? { description: item.summary } : {}),
        provider,
      })),
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "الرئيسية", item: `${siteUrl}/` },
        { "@type": "ListItem", position: 2, name: "الباقات", item: `${siteUrl}${routes.packages}` },
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
