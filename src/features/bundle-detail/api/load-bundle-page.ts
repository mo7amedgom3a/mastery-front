import "server-only";

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { baseOpenGraph, siteConfig } from "@/config/site";

import type { BundleDetailVM } from "../model/types";
import { getBundleDetail } from "./get-bundle-detail";

/** Names that already say what they are ("حزمة …", "مسار …") get no "حزمة" prefix. */
const SELF_DESCRIBING = /^(?:حزمة|مسار)/;
/** Catalog slugs: lowercase words joined by hyphens. Anything else can't be a bundle. */
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function bundleForSlug(slug: string): Promise<BundleDetailVM | null> {
  return SLUG.test(slug) && slug.length <= 260 ? getBundleDetail(slug) : Promise.resolve(null);
}

/** Data for `/bundles/[slug]`. 404s unknown, archived and draft bundles. */
export async function loadBundlePage(slug: string): Promise<BundleDetailVM> {
  const bundle = await bundleForSlug(slug);
  if (!bundle) {
    notFound();
  }
  return bundle;
}

/** Metadata from the same cached request the page makes; unknown slugs get the 404 page's defaults. */
export async function bundleMetadata(slug: string): Promise<Metadata> {
  const bundle = await bundleForSlug(slug);
  if (!bundle) {
    return {};
  }
  const title = SELF_DESCRIBING.test(bundle.title) ? bundle.title : `حزمة ${bundle.title}`;
  const description = bundle.description ?? bundle.summary ?? siteConfig.description;
  return {
    title,
    description,
    alternates: { canonical: bundle.href, languages: { ar: bundle.href, "x-default": bundle.href } },
    openGraph: { ...baseOpenGraph, url: bundle.href, title: bundle.title, description },
    twitter: { card: "summary", title: bundle.title, description },
  };
}
