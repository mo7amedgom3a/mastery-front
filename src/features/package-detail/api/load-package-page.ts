import "server-only";

import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

import { parseProductSlug } from "@/config/routes";
import { baseOpenGraph, siteConfig } from "@/config/site";
import { isPublishable } from "@/features/landing/model/mappers";

import type { PackageDetailData } from "../model/types";
import { getPackageDetail } from "./get-package-detail";

/** Names that already say what they are ("باقة …", "دبلوم …", "برنامج …") get no "باقة" prefix. */
const SELF_DESCRIBING = /^(?:باقة|دبلوم|برنامج)/;

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

async function packageForSlug(slug: string): Promise<PackageDetailData | null> {
  const id = parseProductSlug(safeDecode(slug));
  const data = id === null ? null : await getPackageDetail(id);
  // Inactive and admin-test packages are kept off the storefront, like their cards.
  if (!data || !isPublishable({ active: data.product.indexable, name: data.product.title, image: data.product.image })) {
    return null;
  }
  return data;
}

/**
 * Data for `/packages/[slug]`. 404s unknown or unpublished ids; packages have no link name, so any
 * `/packages/{id}-…` permanently redirects to the canonical `/packages/{id}`.
 */
export async function loadPackagePage(slug: string): Promise<PackageDetailData> {
  const data = await packageForSlug(slug);
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
  const data = await packageForSlug(slug);
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
