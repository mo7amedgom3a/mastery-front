import { getSiteUrl } from "@/config/env";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";
import type { FaqVM } from "@/features/landing/model/types";

import type { ConsultationDetailVM } from "../model/types";

/** Escapes `<` so user-controlled strings can never close the script tag. */
function serialize(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/** The consultation as a Service (its expert, offer and online channel), breadcrumb trail and FAQ. */
export function ConsultationJsonLd({
  consultation,
  faqs,
}: {
  consultation: ConsultationDetailVM;
  faqs: readonly FaqVM[];
}) {
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}${consultation.href}`;
  const { expert } = consultation;
  const organization = { "@type": "EducationalOrganization", name: siteConfig.name, url: siteUrl };

  const graph: Record<string, unknown>[] = [
    {
      "@type": "Service",
      "@id": `${url}#consultation`,
      name: consultation.title,
      url,
      description: consultation.description ?? consultation.summary ?? consultation.title,
      ...(consultation.image ? { image: consultation.image } : {}),
      serviceType: "استشارة فردية",
      inLanguage: "ar",
      brand: { "@type": "Brand", name: siteConfig.name },
      provider: expert
        ? {
            "@type": "Person",
            name: expert.name,
            ...(expert.href ? { url: `${siteUrl}${expert.href}` } : {}),
            ...(expert.avatar ? { image: expert.avatar } : {}),
            ...(expert.summary ? { description: expert.summary } : {}),
            worksFor: organization,
          }
        : organization,
      availableChannel: { "@type": "ServiceChannel", serviceUrl: url, name: "اجتماع مرئي مباشر" },
      ...(consultation.priceAmount || consultation.price.free
        ? {
            offers: {
              "@type": "Offer",
              url,
              price: consultation.priceAmount ?? 0,
              priceCurrency: siteConfig.currency,
              availability: "https://schema.org/InStock",
            },
          }
        : {}),
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "الرئيسية", item: `${siteUrl}/` },
        { "@type": "ListItem", position: 2, name: "الاستشارات", item: `${siteUrl}${routes.consultations}` },
        { "@type": "ListItem", position: 3, name: consultation.title, item: url },
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
