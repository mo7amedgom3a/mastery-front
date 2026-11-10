import { getSiteUrl } from "@/config/env";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";
import type { FaqVM } from "@/features/landing/model/types";
import { JsonLd, breadcrumbList, faqPage, organizationRef } from "@/lib/seo/json-ld";

import { kindListLabel } from "../content/copy";
import type { ProductDetailVM } from "../model/types";

/** Course (with its instructors, offer and online instance), breadcrumb trail and FAQ. */
export function ProductJsonLd({ product, faqs }: { product: ProductDetailVM; faqs: readonly FaqVM[] }) {
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}${product.href}`;
  const listHref = product.kind === "diploma" ? routes.diplomas : routes.courses;
  const instructors = product.trainers.map((trainer) => ({
    "@type": "Person",
    name: trainer.name,
    ...(trainer.href ? { url: `${siteUrl}${trainer.href}` } : {}),
    ...(trainer.avatar ? { image: trainer.avatar } : {}),
    ...(trainer.summary ? { description: trainer.summary } : {}),
  }));
  const teaches = (product.topics ?? []).map((topic) => topic.label).filter(Boolean).slice(0, 12);

  const graph: Record<string, unknown>[] = [
    {
      "@type": "Course",
      "@id": `${url}#course`,
      name: product.title,
      url,
      description: product.description ?? product.summary ?? product.title,
      ...(product.image ? { image: product.image } : {}),
      inLanguage: "ar",
      availableLanguage: "ar",
      // The academy issues a completion certificate for every programme it sells.
      educationalCredentialAwarded: "شهادة إتمام من ماستري أكاديمي",
      ...(product.category ? { about: { "@type": "Thing", name: product.category } } : {}),
      ...(teaches.length > 0 ? { teaches } : {}),
      provider: organizationRef(),
      ...(instructors.length > 0 ? { instructor: instructors } : {}),
      ...(product.priceAmount || product.price.free
        ? {
            offers: {
              "@type": "Offer",
              url,
              price: product.priceAmount ?? 0,
              priceCurrency: siteConfig.currency,
              category: product.price.free ? "Free" : "Paid",
              availability: "https://schema.org/InStock",
            },
          }
        : {}),
      hasCourseInstance: {
        "@type": "CourseInstance",
        courseMode: "Online",
        ...(instructors.length > 0 ? { instructor: instructors } : {}),
      },
    },
    breadcrumbList([
      { name: "الرئيسية", item: `${siteUrl}/` },
      { name: kindListLabel[product.kind], item: `${siteUrl}${listHref}` },
      { name: product.title, item: url },
    ]),
  ];

  if (faqs.length > 0) graph.push(faqPage(faqs));

  return <JsonLd graph={graph} />;
}
