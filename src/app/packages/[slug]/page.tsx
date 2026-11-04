import type { Metadata } from "next";
import { connection } from "next/server";

import { getSiteUrl } from "@/config/env";
import { toQrMatrix } from "@/features/product-detail/api/share-qr";
import { loadPackagePage, packageMetadata } from "@/features/package-detail/api/load-package-page";
import { PackageDetailPage } from "@/features/package-detail/package-detail-page";

// Rendered per request (`connection()` below), never prerendered: Amplify does not finish ISR
// background regeneration, so a prerendered copy (empty if the API was down) would be served forever.
// `revalidate` still sets how long this page's backend reads stay in the data cache, and
// POST /api/revalidate still refreshes them.
export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<"/packages/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  return packageMetadata(slug);
}

export default async function PackagePage({ params }: PageProps<"/packages/[slug]">) {
  await connection();
  const { slug } = await params;
  const data = await loadPackagePage(slug);
  const shareUrl = `${getSiteUrl()}${data.product.href}`;
  const qrMatrix = toQrMatrix(`${shareUrl}?utm_source=qr&utm_medium=share`);
  return <PackageDetailPage data={data} qrMatrix={qrMatrix} />;
}
