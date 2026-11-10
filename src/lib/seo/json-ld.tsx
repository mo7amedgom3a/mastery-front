import { getSiteUrl } from "@/config/env";

/**
 * Small builders shared by every JSON-LD graph. Keeping one serializer and one set of `@id`s means
 * the Organization/WebSite entities are defined once (root layout) and referenced elsewhere, which
 * is what search engines and AI answer engines use to reconcile pages about the same brand.
 */

/** Escapes `<` so API/user strings can never close the script tag. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function JsonLd({ graph }: { graph: Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      // Safe: static structure, JSON-serialised and `<`-escaped above.
      dangerouslySetInnerHTML={{ __html: serializeJsonLd({ "@context": "https://schema.org", "@graph": graph }) }}
    />
  );
}

export function organizationId(): string {
  return `${getSiteUrl()}/#organization`;
}

export function websiteId(): string {
  return `${getSiteUrl()}/#website`;
}

export function organizationRef(): Record<string, string> {
  return { "@id": organizationId() };
}

export function websiteRef(): Record<string, string> {
  return { "@id": websiteId() };
}

/** A breadcrumb trail from ordered `{ name, item }` pairs (absolute item URLs). */
export function breadcrumbList(items: readonly { name: string; item: string }[]): Record<string, unknown> {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((entry, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: entry.name,
      item: entry.item,
    })),
  };
}

/** FAQPage markup for the visible disclosure list; callers pass only sanitized entries. */
export function faqPage(faqs: readonly { question: string; answer: string }[]): Record<string, unknown> {
  return {
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
}

export function webPage(input: {
  url: string;
  name: string;
  description?: string | null;
  dateModified?: string | null;
}): Record<string, unknown> {
  return {
    "@type": "WebPage",
    "@id": `${input.url}#webpage`,
    url: input.url,
    name: input.name,
    ...(input.description ? { description: input.description } : {}),
    ...(input.dateModified ? { dateModified: input.dateModified } : {}),
    inLanguage: "ar",
    isPartOf: websiteRef(),
    about: organizationRef(),
  };
}

export function itemList(
  name: string,
  items: readonly { name: string; url: string }[],
): Record<string, unknown> {
  return {
    "@type": "ItemList",
    name,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: item.url,
    })),
  };
}
