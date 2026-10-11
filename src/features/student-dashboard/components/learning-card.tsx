import { CalendarX, Infinity as Lifetime, PlayCircle } from "lucide-react";
import type { Route } from "next";
import Image from "next/image";

import { brandBg, brandColorAt } from "@/components/ui/brand-colors";
import { AppLink } from "@/components/ui/app-link";
import { buttonClass } from "@/components/ui/button";
import type { OwnedProductResponse } from "@/lib/api/commerce";
import { formatDate } from "@/lib/format";
import { catalogProductHref } from "@/lib/shop/product-links";
import { cn } from "@/lib/cn";

import { productTypeLabel } from "../model/products";

const CARD_SIZES = "(min-width: 1200px) 320px, (min-width: 600px) 50vw, 100vw";

/**
 * A product the customer has access to. The LMS doesn't report progress to this site yet, so the
 * card shows how long access lasts instead of a progress bar.
 */
type LearningCardProps = {
  product: OwnedProductResponse;
  index: number;
  /** Catalog artwork and name, when the shop knows the product (see `useCatalogArtwork`). */
  image?: string | null;
  fallbackTitle?: string | null;
};

export function LearningCard({ product, index, image, fallbackTitle }: LearningCardProps) {
  const href = catalogProductHref(product.slug, product.product_type) as Route;
  const title =
    product.title && product.title !== product.slug
      ? product.title
      : (fallbackTitle ?? productTypeLabel(product.product_type));
  const active = product.access_status === "active";

  return (
    <article className="ma-card relative h-full">
      <div className={cn("ma-card__media relative grid place-items-center overflow-hidden p-0", brandBg[brandColorAt(index)])}>
        {image ? (
          <Image src={image} alt="" fill sizes={CARD_SIZES} className="object-cover" />
        ) : (
          <PlayCircle aria-hidden="true" className="size-12 fill-none text-ink" strokeWidth={1.5} />
        )}
        <span className="ma-tag ma-tag--cream absolute start-4 top-4 z-10">{productTypeLabel(product.product_type)}</span>
      </div>
      <div className="ma-card__body">
        <h3 className="ma-card__title line-clamp-2">{title}</h3>
        {product.short_description ? (
          <p className="m-0 line-clamp-2 text-sm leading-6 text-fg-muted">{product.short_description}</p>
        ) : null}
        <p className="m-0 mt-auto flex items-center gap-2 text-sm text-fg-muted">
          {product.expires_at ? (
            <>
              <CalendarX aria-hidden="true" className="size-4 shrink-0 fill-none text-accent" />
              {active ? "متاح حتى" : "انتهى في"} {formatDate(product.expires_at)}
            </>
          ) : (
            <>
              <Lifetime aria-hidden="true" className="size-4 shrink-0 fill-none text-accent" />
              وصول مدى الحياة
            </>
          )}
        </p>
      </div>
      <div className="ma-card__foot">
        <AppLink href={href} className={cn(buttonClass({ variant: active ? "primary" : "soft", block: true }), "gap-2")}>
          <PlayCircle aria-hidden="true" className="size-5 fill-none" />
          {active ? "كمّل التعلّم" : "عرض البرنامج"}
        </AppLink>
      </div>
    </article>
  );
}
