import { getSiteUrl } from "@/config/env";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";
import { JsonLd, breadcrumbList, faqPage, organizationRef, webPage } from "@/lib/seo/json-ld";

import { trainersPageCopy } from "../content/copy";

/** `/trainers`: WebPage + Service (joining the trainer network) + FAQPage + breadcrumb trail. */
export function TrainersJsonLd() {
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}${routes.trainers}`;

  const graph: Record<string, unknown>[] = [
    {
      ...webPage({
        url,
        name: trainersPageCopy.metaTitle,
        description: trainersPageCopy.description,
      }),
      "@id": `${url}#service`,
      "@type": "Service",
      name: "الانضمام إلى شبكة مدربي ماستري",
      serviceType: "Trainer onboarding and course production",
      provider: organizationRef(),
      url,
      description: trainersPageCopy.description,
      audience: { "@type": "Audience", audienceType: "الخبراء والمدربون والمستشارون" },
    },
    faqPage(trainersPageCopy.faq.items),
    breadcrumbList([
      { name: "الرئيسية", item: `${siteUrl}/` },
      { name: `انضم كمدرب — ${siteConfig.name}`, item: url },
    ]),
  ];

  return <JsonLd graph={graph} />;
}
