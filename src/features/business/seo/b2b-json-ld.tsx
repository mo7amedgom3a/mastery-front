import { getSiteUrl } from "@/config/env";
import { breadcrumbList, organizationRef } from "@/lib/seo/json-ld";

/** Escapes `<` so user-controlled strings can never close the script tag. */
function serialize(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/** WebPage + Service + FAQPage for `/business/b2b` (the FAQ markup mirrors the visible disclosure list). */
export function B2bJsonLd({ faqs }: { faqs: readonly { question: string; answer: string }[] }) {
  const siteUrl = getSiteUrl();
  const pageUrl = `${siteUrl}/business/b2b`;

  const graph: Record<string, unknown>[] = [
    {
      "@type": "WebPage",
      "@id": `${pageUrl}#webpage`,
      url: pageUrl,
      name: "منصة ماستري للشركات",
      description:
        "منصة تدريب متكاملة للشركات: مكتبة في 13 مجالاً، مسارات مخصصة، استشارات خبراء، متابعة وتقارير وشهادات إتمام.",
      inLanguage: "ar",
      isPartOf: { "@id": `${siteUrl}/#website` },
    },
    {
      "@type": "Service",
      name: "تدريب الشركات وفرق العمل",
      serviceType: "Corporate training and workforce development",
      provider: organizationRef(),
      areaServed: "SA",
      audience: { "@type": "BusinessAudience" },
      description:
        "مسارات تدريبية مخصصة للشركات، مكتبة تدريبية في 13 مجالاً، استشارات خبراء، ومتابعة وتقارير لمدراء التدريب.",
      url: pageUrl,
    },
    {
      "@type": "FAQPage",
      mainEntity: faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: { "@type": "Answer", text: faq.answer },
      })),
    },
    breadcrumbList([
      { name: "الرئيسية", item: `${siteUrl}/` },
      { name: "للشركات", item: `${siteUrl}/business` },
      { name: "منصة ماستري للشركات", item: pageUrl },
    ]),
  ];

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serialize({ "@context": "https://schema.org", "@graph": graph }) }}
    />
  );
}
