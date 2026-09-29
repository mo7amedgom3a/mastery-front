import type { Metadata } from "next";

import { loadProductPage, productMetadata } from "@/features/product-detail/api/load-product-page";
import { ProductDetailPage } from "@/features/product-detail/product-detail-page";

// ISR: each diploma page is built on its first visit, then refreshed at most every 5 minutes or on
// demand via POST /api/revalidate. Keep in sync with PRODUCT_REVALIDATE_SECONDS.
export const revalidate = 300;

export function generateStaticParams(): { slug: string }[] {
  return [];
}

export async function generateMetadata({ params }: PageProps<"/diplomas/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  return productMetadata(slug);
}

export default async function DiplomaPage({ params }: PageProps<"/diplomas/[slug]">) {
  const { slug } = await params;
  const data = await loadProductPage("diploma", slug);
  return <ProductDetailPage data={data} />;
}
