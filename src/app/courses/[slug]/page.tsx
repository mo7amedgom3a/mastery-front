import type { Metadata } from "next";

import { loadProductPage, productMetadata } from "@/features/product-detail/api/load-product-page";
import { ProductDetailPage } from "@/features/product-detail/product-detail-page";

// Incremental static regeneration: each slug is rendered on its first visit (no build-time
// fetch, see generateStaticParams) and then served from the cache,
// refreshed in the background every `revalidate` seconds and at once by POST /api/revalidate
// (the admin's publish hook). On Cloudflare the cache lives in R2 (open-next.config.ts).
export const revalidate = 300;

export function generateStaticParams(): never[] {
  return [];
}

export async function generateMetadata({ params }: PageProps<"/courses/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  return productMetadata(slug, "course");
}

export default async function CoursePage({ params }: PageProps<"/courses/[slug]">) {
  const { slug } = await params;
  const data = await loadProductPage("course", slug);
  return <ProductDetailPage data={data} />;
}
