import type { Metadata } from "next";

import { bundleMetadata, loadBundlePage } from "@/features/bundle-detail/api/load-bundle-page";
import { BundleDetailPage } from "@/features/bundle-detail/bundle-detail-page";
import { toQrMatrix } from "@/features/product-detail/api/share-qr";
import { getSiteUrl } from "@/config/env";

// Incremental static regeneration: each slug is rendered on its first visit (no build-time
// fetch, see generateStaticParams) and then served from the cache,
// refreshed in the background every `revalidate` seconds and at once by POST /api/revalidate
// (the admin's publish hook). On Cloudflare the cache lives in R2 (open-next.config.ts).
export const revalidate = 300;

export function generateStaticParams(): never[] {
  return [];
}

export async function generateMetadata({ params }: PageProps<"/bundles/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  return bundleMetadata(slug);
}

export default async function BundlePage({ params }: PageProps<"/bundles/[slug]">) {
  const { slug } = await params;
  const bundle = await loadBundlePage(slug);
  return <BundleDetailPage bundle={bundle} qr={toQrMatrix(`${getSiteUrl()}${bundle.href}?utm_source=qr&utm_medium=share`)} />;
}
