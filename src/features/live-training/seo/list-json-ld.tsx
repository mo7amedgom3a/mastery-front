import { getSiteUrl } from "@/config/env";
import { routes } from "@/config/routes";
import { JsonLd, breadcrumbList, itemList, webPage } from "@/lib/seo/json-ld";

import { livePageCopy } from "../content/copy";
import type { LiveTrainingVM } from "../model/types";

/** `/live`: the listing as a CollectionPage/ItemList plus its breadcrumb trail. */
export function LiveListJsonLd({ trainings }: { trainings: readonly LiveTrainingVM[] }) {
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}${routes.live}`;

  const graph: Record<string, unknown>[] = [
    {
      ...webPage({ url, name: livePageCopy.title, description: livePageCopy.description }),
      "@id": `${url}#collection`,
      "@type": "CollectionPage",
      mainEntity: itemList(
        livePageCopy.title,
        trainings.map((training) => ({
          name: training.title,
          url: `${siteUrl}${routes.liveTraining(training.catalogSlug)}`,
        })),
      ),
    },
    breadcrumbList([
      { name: "الرئيسية", item: `${siteUrl}/` },
      { name: livePageCopy.title, item: url },
    ]),
  ];

  return <JsonLd graph={graph} />;
}
