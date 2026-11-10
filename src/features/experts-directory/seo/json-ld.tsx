import { getSiteUrl } from "@/config/env";
import { routes } from "@/config/routes";
import { JsonLd, breadcrumbList, itemList, webPage } from "@/lib/seo/json-ld";

import type { ExpertCardVM } from "../model";

/** `/experts`: the directory as a CollectionPage of Person entities, plus its breadcrumb trail. */
export function ExpertsListJsonLd({ experts }: { experts: readonly ExpertCardVM[] }) {
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}${routes.experts}`;
  const title = "المدربون والخبراء";

  const graph: Record<string, unknown>[] = [
    {
      ...webPage({
        url,
        name: title,
        description:
          "تعرّف على مدربي وخبراء ماستري: مجالاتهم، دوراتهم ودبلوماتهم وباقاتهم، والاستشارات الفردية التي يقدّمونها.",
      }),
      "@id": `${url}#collection`,
      "@type": "CollectionPage",
      mainEntity: itemList(
        title,
        experts.map((expert) => ({ name: expert.name, url: `${siteUrl}${expert.href}` })),
      ),
      about: experts.slice(0, 24).map((expert) => ({
        "@type": "Person",
        name: expert.name,
        url: `${siteUrl}${expert.href}`,
        ...(expert.avatar ? { image: expert.avatar } : {}),
        ...(expert.title ? { jobTitle: expert.title } : {}),
        ...(expert.fields.length > 0 ? { knowsAbout: expert.fields } : {}),
      })),
    },
    breadcrumbList([
      { name: "الرئيسية", item: `${siteUrl}/` },
      { name: title, item: url },
    ]),
  ];

  return <JsonLd graph={graph} />;
}
