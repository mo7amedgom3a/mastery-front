import "server-only";

import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

import { parseProductSlug } from "@/config/routes";
import { baseOpenGraph, siteConfig } from "@/config/site";

import { kindLabel } from "../content/copy";
import type { ProductDetailData, ProductKind } from "../model/types";
import { getProductDetail } from "./get-product-detail";

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/**
 * Data for `/courses/[slug]` and `/diplomas/[slug]`. 404s unknown ids; permanently redirects to the
 * canonical `/{kind}s/{id}-{link_name}` when the kind or the name part is off (e.g. `/courses/213`
 * from a recommendation card, or a renamed course).
 */
export async function loadProductPage(routeKind: ProductKind, slug: string): Promise<ProductDetailData> {
  const id = parseProductSlug(safeDecode(slug));
  if (id === null) {
    notFound();
  }
  const data = await getProductDetail(id);
  if (!data) {
    notFound();
  }
  const canonical = data.product.href;
  const requested = `/${routeKind}s/${slug}`;
  if (data.product.kind !== routeKind || safeDecode(requested) !== safeDecode(canonical)) {
    permanentRedirect(canonical);
  }
  return data;
}

/** Metadata from the same cached request the page makes; unknown ids get the 404 page's defaults. */
export async function productMetadata(slug: string): Promise<Metadata> {
  const id = parseProductSlug(safeDecode(slug));
  const data = id === null ? null : await getProductDetail(id);
  if (!data) {
    return {};
  }
  const { product } = data;
  // "دورة …"/"دبلوم …" is how learners search; most diploma names already start with it.
  const noun = kindLabel[product.kind];
  const title = product.title.startsWith(noun) ? product.title : `${noun} ${product.title}`;
  const description = product.description ?? product.summary ?? siteConfig.description;
  return {
    title,
    description,
    alternates: { canonical: product.href, languages: { ar: product.href, "x-default": product.href } },
    openGraph: {
      ...baseOpenGraph,
      url: product.href,
      title: product.title,
      description,
      ...(product.image ? { images: [{ url: product.image, alt: product.title }] } : {}),
    },
    twitter: {
      card: product.image ? "summary_large_image" : "summary",
      title: product.title,
      description,
      ...(product.image ? { images: [product.image] } : {}),
    },
    ...(product.indexable ? {} : { robots: { index: false, follow: true } }),
  };
}
