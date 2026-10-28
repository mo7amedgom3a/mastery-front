import { BidiText } from "@/components/content/bidi";
import { AppLink } from "@/components/ui/app-link";
import { productHref } from "@/lib/catalog/product-href";
import { formatPrice } from "@/lib/format";
import { trackAdvisor, trackProductClickFromHref } from "@/lib/observability/behavior";

import { advisorCopy, productTypeLabel } from "../content/copy";
import { closeAdvisorOnSmallScreen } from "../model/store";
import type { AdvisorProduct } from "../model/types";

/**
 * A product the advisor recommended, linking to its detail page in the same tab: the widget lives in
 * the root layout, so the chat is still there on the product page.
 */
export function AdvisorProductCard({ product, position }: { product: AdvisorProduct; position: number }) {
  const href = productHref(product, product.title);
  if (!href) return null;
  const amount = product.price_amount === null ? null : Number(product.price_amount);
  const price = amount === 0 ? advisorCopy.free : (formatPrice(amount, product.currency_code) ?? advisorCopy.priceOnRequest);
  const type = productTypeLabel[product.product_type];

  return (
    <AppLink
      href={href}
      onClick={() => {
        trackAdvisor("ai_recommendation_clicked", { slug: product.slug, product_type: product.product_type, position });
        trackProductClickFromHref(href, product.title, { surface: "ai_advisor", position });
        closeAdvisorOnSmallScreen();
      }}
      className="flex items-start gap-3 rounded-panel border border-line bg-surface p-2.5 text-fg no-underline transition-colors hover:border-line-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
    >
      <span className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-photo bg-surface-alt text-xl font-bold text-fg-muted">
        {product.image_url ? (
          // Catalog images come from several hosts; a plain img keeps them out of the optimizer's allowlist.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.image_url} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" className="size-full object-cover" />
        ) : (
          <span aria-hidden="true">{product.title.trim().charAt(0)}</span>
        )}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="line-clamp-2 text-sm leading-6 font-bold">
          <BidiText text={product.title} />
        </span>
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs leading-5 text-fg-muted">
          {type ? <span className="ma-tag ma-tag--soft">{type}</span> : null}
          <bdi className="font-medium text-fg">{price}</bdi>
        </span>
        <span className="text-xs leading-5 font-medium underline underline-offset-4">{advisorCopy.openProduct}</span>
      </span>
    </AppLink>
  );
}
