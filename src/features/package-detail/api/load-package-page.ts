import "server-only";

import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

import { parseProductSlug } from "@/config/routes";
import { baseOpenGraph, siteConfig } from "@/config/site";

import type { PackageDetailData } from "../model/types";
import { getB2CPackageDetail } from "./get-package-detail-b2c";

/** Names that already say what they are ("باقة …", "دبلوم …", "برنامج …") get no "باقة" prefix. */
const SELF_DESCRIBING = /^(?:باقة|دبلوم|برنامج)/;

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

async function packageForSlug(slug: string, preview: boolean): Promise<PackageDetailData | null> {
  const id = parseProductSlug(safeDecode(slug));
  const data = id === null ? null : await getB2CPackageDetail(id, preview);
  // Unpublished packages are kept off the storefront; the admin Studio preview (`?preview=1`) shows them.
  if (!preview && (!data || !data.product.indexable)) {
    return null;
  }
  return data;
}

/**
 * Data for `/packages/[slug]`. 404s unknown or unpublished ids; packages have no link name, so any
 * `/packages/{id}-…` permanently redirects to the canonical `/packages/{id}`. `preview` (the admin
 * Studio's `?preview=1`) reads fresh, uncached data and allows unpublished packages so edits show at once.
 */
export async function loadPackagePage(slug: string, preview = false): Promise<PackageDetailData> {
  const data = await packageForSlug(slug, preview);
  if (!data) {
    notFound();
  }
  if (safeDecode(`/packages/${slug}`) !== data.product.href) {
    permanentRedirect(data.product.href);
  }
  return data;
}

/** Metadata from the same cached request the page makes; unknown ids get the 404 page's defaults. */
export async function packageMetadata(slug: string): Promise<Metadata> {
  const data = await packageForSlug(slug, false);
  if (!data) {
    return {};
  }
  const { product } = data;
  const title = SELF_DESCRIBING.test(product.title) ? product.title : `باقة ${product.title}`;
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
  };
}
