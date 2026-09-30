import { getSiteUrl } from "@/config/env";
import { routes } from "@/config/routes";

import type { ResultCardVM } from "../model/types";

/** Escapes `<` so user-controlled strings can never close the script tag. */
function serialize(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

type SearchJsonLdProps = {
  /** Canonical path of this listing. */
  href: string;
  heading: string;
  cards: readonly ResultCardVM[];
  /** Position of the first card in the whole list (1 on the first page). */
  start: number;
};

/** The listing as an ItemList (each card a link to its own page), and its breadcrumb trail. */
export function SearchJsonLd({ href, heading, cards, start }: SearchJsonLdProps) {
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}${href}`;
  const isRoot = href === routes.search;

  const graph = [
    {
      "@type": "CollectionPage",
      "@id": `${url}#page`,
      url,
      name: heading,
      inLanguage: "ar",
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: cards.length,
        itemListElement: cards.map((card, index) => ({
          "@type": "ListItem",
          position: start + index,
          name: card.title,
          url: `${siteUrl}${card.href}`,
        })),
      },
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "الرئيسية", item: `${siteUrl}/` },
        { "@type": "ListItem", position: 2, name: "كل البرامج", item: `${siteUrl}${routes.search}` },
        ...(isRoot ? [] : [{ "@type": "ListItem", position: 3, name: heading, item: url }]),
      ],
    },
  ];

  return (
    <script
      type="application/ld+json"
      // Safe: static structure, JSON-serialised and `<`-escaped above.
      dangerouslySetInnerHTML={{ __html: serialize({ "@context": "https://schema.org", "@graph": graph }) }}
    />
  );
}
