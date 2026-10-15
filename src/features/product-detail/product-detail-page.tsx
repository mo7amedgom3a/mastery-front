import { getSiteUrl } from "@/config/env";

import { toQrMatrix } from "./api/share-qr";
import { ProductDetailView, type ShareProps } from "./components/product-detail-view";
import { kindLabel } from "./content/copy";
import { productFacts } from "./model/facts";
import type { ProductDetailData } from "./model/types";

/**
 * Server component wrapper for the course/diploma page.
 * Computes server-only properties (QR code, site URL) and renders the client-safe view.
 */
export function ProductDetailPage({ data }: { data: ProductDetailData }) {
  const { product } = data;
  const noun = kindLabel[product.kind];
  const shareUrl = `${getSiteUrl()}${product.href}`;
  const shareProps: ShareProps = {
    url: shareUrl,
    title: product.title,
    kindLabel: noun,
    tagClassName: product.kind === "diploma" ? "ma-tag--yellow" : "ma-tag--coral",
    facts: productFacts(product).map((fact) => fact.label),
    trainers: product.trainers.map(({ name, avatar, initial }) => ({ name, avatar, initial })),
    // Scans are tagged so they can be told apart from other visits in analytics.
    qr: toQrMatrix(`${shareUrl}?utm_source=qr&utm_medium=share`),
    fileName: `${product.kind}-${product.id}`,
  };

  return <ProductDetailView data={data} shareProps={shareProps} preview={false} />;
}
