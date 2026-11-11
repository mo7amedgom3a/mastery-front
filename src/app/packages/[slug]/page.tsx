import type { Metadata } from "next";

import { getSiteUrl } from "@/config/env";
import { toQrMatrix } from "@/features/product-detail/api/share-qr";
import { loadPackagePage, packageMetadata } from "@/features/package-detail/api/load-package-page";
import { PackageDetailPage } from "@/features/package-detail/package-detail-page";

// Incremental static regeneration: each slug is rendered on its first visit (no build-time
// fetch, see generateStaticParams) and then served from the cache,
// refreshed in the background every `revalidate` seconds and at once by POST /api/revalidate
// (the admin's publish hook). On Cloudflare the cache lives in R2 (open-next.config.ts).
export const revalidate = 300;

export function generateStaticParams(): never[] {
  return [];
}

export async function generateMetadata({ params }: PageProps<"/packages/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  return packageMetadata(slug);
}

export default async function PackagePage({ params }: PageProps<"/packages/[slug]">) {
  const { slug } = await params;
  const data = await loadPackagePage(slug);
  const shareUrl = `${getSiteUrl()}${data.product.href}`;
  const qrMatrix = toQrMatrix(`${shareUrl}?utm_source=qr&utm_medium=share`);
  return <PackageDetailPage data={data} qrMatrix={qrMatrix} />;
}
