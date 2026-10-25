import type { Metadata } from "next";

import { bundleMetadata, loadBundlePage } from "@/features/bundle-detail/api/load-bundle-page";
import { BundleDetailPage } from "@/features/bundle-detail/bundle-detail-page";
import { toQrMatrix } from "@/features/product-detail/api/share-qr";
import { getSiteUrl } from "@/config/env";

// ISR: each bundle page is built on its first visit, then refreshed at most every 5 minutes or on
// demand via POST /api/revalidate. Keep in sync with BUNDLE_REVALIDATE_SECONDS.
export const revalidate = 300;

export function generateStaticParams(): { slug: string }[] {
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
