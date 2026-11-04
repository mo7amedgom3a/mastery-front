import type { Metadata } from "next";
import { connection } from "next/server";

import { loadProductPage, productMetadata } from "@/features/product-detail/api/load-product-page";
import { ProductDetailPage } from "@/features/product-detail/product-detail-page";

// Rendered per request (`connection()` below), never prerendered: Amplify does not finish ISR
// background regeneration, so a prerendered copy (empty if the API was down) would be served forever.
// `revalidate` still sets how long this page's backend reads stay in the data cache, and
// POST /api/revalidate still refreshes them.
export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<"/courses/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  return productMetadata(slug, "course");
}

export default async function CoursePage({ params }: PageProps<"/courses/[slug]">) {
  await connection();
  const { slug } = await params;
  const data = await loadProductPage("course", slug);
  return <ProductDetailPage data={data} />;
}
