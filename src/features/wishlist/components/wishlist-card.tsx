import { Check, Clock, Layers, ShoppingCart, Trash2, UserRound } from "lucide-react";
import type { Route } from "next";

import { AppLink } from "@/components/ui/app-link";
import type { BrandColor } from "@/components/ui/brand-colors";
import { ProductCard, type ProductCardMeta } from "@/components/ui/product-card";
import { routes } from "@/config/routes";
import { cn } from "@/lib/cn";
import { formatCount } from "@/lib/format";
import { noPricing, toPricing } from "@/lib/pricing";
import type { ShopItemKind } from "@/lib/shop/contract";

import type { WishlistItemVM } from "../model/view";

const COURSE_FORMS = { one: "دورة واحدة", two: "دورتان", few: "دورات", many: "دورة" };
const kindColor: Record<ShopItemKind, BrandColor> = {
  course: "coral",
  diploma: "yellow",
  package: "green",
  consultation: "lilac",
};

const ACTION = "ma-btn ma-btn--sm min-h-10 gap-1.5 px-3 text-[13px]";

type WishlistCardProps = {
  item: WishlistItemVM;
  inCart: boolean;
  onAddToCart: (item: WishlistItemVM) => void;
  onRemove: (item: WishlistItemVM) => void;
  sizes?: string;
};

/**
 * A saved item as a product card. The footer action fits the item: add to cart, book (consultations
 * need a slot), enrol (free items), or nothing when it left the catalog. Remove is always there.
 */
export function WishlistCard({ item, inCart, onAddToCart, onRemove, sizes }: WishlistCardProps) {
  const meta: ProductCardMeta[] = [];
  if (item.instructor) meta.push({ icon: UserRound, label: item.instructor });
  if (item.duration) meta.push({ icon: Clock, label: item.duration });
  if (item.courseCount) meta.push({ icon: Layers, label: formatCount(item.courseCount, COURSE_FORMS) });

  const href = item.href as Route;
  const price = item.available ? toPricing(item.free ? 0 : item.priceAmount, item.originalAmount) : noPricing;

  let primary = null;
  if (!item.available) {
    primary = <span className="text-[13px] font-medium text-fg-muted">غير متاح حالياً</span>;
  } else if (item.kind === "consultation") {
    primary = (
      <AppLink href={href} aria-label={`احجز موعداً في «${item.title}»`} className={cn(ACTION, "ma-btn--soft")}>
        احجز موعداً
      </AppLink>
    );
  } else if (item.free) {
    primary = (
      <AppLink href={href} aria-label={`سجّل مجاناً في «${item.title}»`} className={cn(ACTION, "ma-btn--soft")}>
        سجّل مجاناً
      </AppLink>
    );
  } else if (item.purchasable && inCart) {
    primary = (
      <AppLink href={routes.cart} prefetch aria-label={`«${item.title}» في السلة — اذهب إلى السلة`} className={cn(ACTION, "ma-btn--secondary")}>
        <Check aria-hidden="true" className="size-[18px] fill-none" />
        في السلة
      </AppLink>
    );
  } else if (item.purchasable) {
    primary = (
      <button
        type="button"
        onClick={() => onAddToCart(item)}
        aria-label={`إضافة «${item.title}» إلى السلة`}
        className={cn(ACTION, "ma-btn--soft")}
      >
        <ShoppingCart aria-hidden="true" className="size-[18px] fill-none" />
        أضف للسلة
      </button>
    );
  } else {
    primary = (
      <AppLink href={href} aria-label={`تفاصيل «${item.title}»`} className={cn(ACTION, "ma-btn--soft")}>
        التفاصيل
      </AppLink>
    );
  }

  return (
    <ProductCard
      href={href}
      title={item.title}
      image={item.image}
      // Consultant artwork puts the expert's name at the bottom edge: full width, uncropped.
      media={item.kind === "consultation" ? "natural" : "wide"}
      color={kindColor[item.kind]}
      tag={item.tag}
      meta={meta}
      price={price}
      sizes={sizes}
      tracking={{ surface: "wishlist" }}
      className={item.available ? undefined : "[&_.ma-card\\_\\_media]:opacity-50"}
      actions={
        // Above the card's stretched title link, like every card's footer actions.
        <div className="relative z-10 flex items-center gap-2">
          {primary}
          <button
            type="button"
            onClick={() => onRemove(item)}
            aria-label={`إزالة «${item.title}» من المفضلة`}
            className="ma-btn ma-btn--bare ma-btn--icon ma-btn--sm size-10 min-h-10"
          >
            <Trash2 aria-hidden="true" className="size-[18px] fill-none" />
          </button>
        </div>
      }
    />
  );
}
