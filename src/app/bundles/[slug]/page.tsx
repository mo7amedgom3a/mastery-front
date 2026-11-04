import type { Metadata } from "next";
import { connection } from "next/server";

import { bundleMetadata, loadBundlePage } from "@/features/bundle-detail/api/load-bundle-page";
import { BundleDetailPage } from "@/features/bundle-detail/bundle-detail-page";
import { toQrMatrix } from "@/features/product-detail/api/share-qr";
import { getSiteUrl } from "@/config/env";

// Rendered per request (`connection()` below), never prerendered: Amplify does not finish ISR
// background regeneration, so a prerendered copy (empty if the API was down) would be served forever.
// `revalidate` still sets how long this page's backend reads stay in the data cache, and
// POST /api/revalidate still refreshes them.
export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<"/bundles/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  return bundleMetadata(slug);
}

export default async function BundlePage({ params }: PageProps<"/bundles/[slug]">) {
  await connection();
  const { slug } = await params;
  const bundle = await loadBundlePage(slug);
  return <BundleDetailPage bundle={bundle} qr={toQrMatrix(`${getSiteUrl()}${bundle.href}?utm_source=qr&utm_medium=share`)} />;
}
