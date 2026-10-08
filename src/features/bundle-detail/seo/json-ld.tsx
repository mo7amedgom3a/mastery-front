import { getSiteUrl } from "@/config/env";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";
import type { FaqVM } from "@/features/landing/model/types";

import { MOCK_PRICING } from "../content/mock-pricing";
import type { BundleDetailVM } from "../model/types";

/** Escapes `<` so user-controlled strings can never close the script tag. */
function serialize(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/** The bundle as a Product whose parts are its members, its breadcrumb trail and FAQ. */
export function BundleJsonLd({ bundle, faqs }: { bundle: BundleDetailVM; faqs: readonly FaqVM[] }) {
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}${bundle.href}`;
  const provider = { "@type": "EducationalOrganization", name: siteConfig.name, url: siteUrl };

  const graph: Record<string, unknown>[] = [
    {
      "@type": "Product",
      "@id": `${url}#bundle`,
      name: bundle.title,
      url,
      description: bundle.description ?? bundle.summary ?? bundle.title,
      brand: { "@type": "Brand", name: siteConfig.name },
      ...(bundle.skills.length > 0 ? { keywords: bundle.skills.join("، ") } : {}),
      // Placeholder prices must never reach search engines.
      ...(!MOCK_PRICING && bundle.priceAmount
        ? {
            offers: {
              "@type": "Offer",
              url,
              price: bundle.priceAmount,
              priceCurrency: siteConfig.currency,
              availability: "https://schema.org/InStock",
            },
          }
        : {}),
      hasPart: bundle.members.map((member) => ({
        "@type": member.kind === "consultation" ? "Service" : "Course",
        name: member.title,
        ...(member.href ? { url: `${siteUrl}${member.href}` } : {}),
        ...(member.summary ? { description: member.summary } : {}),
        provider,
      })),
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "الرئيسية", item: `${siteUrl}/` },
        { "@type": "ListItem", position: 2, name: "حزم ماستري", item: `${siteUrl}${routes.section("bundles")}` },
        { "@type": "ListItem", position: 3, name: bundle.title, item: url },
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
