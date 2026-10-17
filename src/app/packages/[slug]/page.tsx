import type { Metadata } from "next";

import { getSiteUrl } from "@/config/env";
import { toQrMatrix } from "@/features/product-detail/api/share-qr";
import { loadPackagePage, packageMetadata } from "@/features/package-detail/api/load-package-page";
import { PackageDetailPage } from "@/features/package-detail/package-detail-page";

// ISR: each package page is built on its first visit, then refreshed at most every 5 minutes or on
// demand via POST /api/revalidate. Keep in sync with PACKAGE_REVALIDATE_SECONDS.
export const revalidate = 300;

export function generateStaticParams(): { slug: string }[] {
  return [];
}

export async function generateMetadata({ params }: PageProps<"/packages/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  return packageMetadata(slug);
}

export default async function PackagePage({ params, searchParams }: PageProps<"/packages/[slug]">) {
  const { slug } = await params;
  const preview = (await searchParams)?.preview === "1";
  const data = await loadPackagePage(slug, preview);
  const shareUrl = `${getSiteUrl()}${data.product.href}`;
  const qrMatrix = toQrMatrix(`${shareUrl}?utm_source=qr&utm_medium=share`);
  return <PackageDetailPage data={data} qrMatrix={qrMatrix} />;
}
