import { getSiteUrl } from "@/config/env";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";
import { JsonLd, breadcrumbList, faqPage, organizationRef, webPage } from "@/lib/seo/json-ld";

/** `/business`: WebPage + Service + FAQPage (mirrors the visible FAQ) + breadcrumb trail. */
export function BusinessJsonLd({ faqs }: { faqs: readonly { question: string; answer: string }[] }) {
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}${routes.business}`;

  const graph: Record<string, unknown>[] = [
    {
      ...webPage({
        url,
        name: `${siteConfig.name} للأعمال — تدريب الشركات وفرق العمل`,
        description:
          "حلول تدريب مؤسسي من ماستري: مسارات مخصصة لفرق العمل، مكتبة تدريبية، استشارات خبراء، ومتابعة وتقارير لمدراء التدريب.",
      }),
      "@id": `${url}#service`,
      "@type": "Service",
      name: "تدريب الشركات وفرق العمل",
      serviceType: "Corporate training and workforce development",
      provider: organizationRef(),
      description:
        "مسارات تدريبية مخصصة للشركات، مكتبة تدريبية في مجالات متعددة، استشارات خبراء، ومتابعة وتقارير لمدراء التدريب.",
      url,
      audience: { "@type": "BusinessAudience" },
    },
  ];

  if (faqs.length > 0) graph.push(faqPage(faqs));

  graph.push(
    breadcrumbList([
      { name: "الرئيسية", item: `${siteUrl}/` },
      { name: "للشركات", item: url },
    ]),
  );

  return <JsonLd graph={graph} />;
}
