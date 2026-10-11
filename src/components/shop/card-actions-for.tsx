import { CardActions } from "@/components/shop/card-actions";
import { PurchaseActions } from "@/components/shop/purchase-actions";
import { BuyNowButton } from "@/features/checkout/components/buy-now-button";
import { EnrollFreeButton } from "@/features/checkout/components/enroll-free-button";
import type { Pricing } from "@/lib/pricing";
import type { ShopItem, ShopItemKind } from "@/lib/shop/store";

export type ShopSource = {
  id: number;
  title: string;
  href: string;
  image: string | null;
  price: Pricing;
  priceAmount: number | null;
};

export function toShopItem(kind: ShopItemKind, source: ShopSource): ShopItem {
  return {
    key: `${kind}:${source.id}`,
    kind,
    id: source.id,
    title: source.title,
    href: source.href,
    image: source.image,
    priceAmount: source.priceAmount,
  };
}

/** Whether the item can go in the cart: priced, not free, and not a consultation (those need a booked slot). */
export function isPurchasable(kind: ShopItemKind, source: ShopSource): boolean {
  return !source.price.free && kind !== "consultation" && source.priceAmount !== null;
}

/**
 * Wishlist + cart controls for a product. Consultations need a booked slot, so they can be saved
 * but not added to the cart. Free items get an enrol link instead of the cart.
 */
export function actionsFor(kind: ShopItemKind, source: ShopSource) {
  return (
    <CardActions item={toShopItem(kind, source)} purchasable={isPurchasable(kind, source)} free={source.price.free} />
  );
}

/** Whether the item can be joined for free right away (consultations still need a booked slot). */
export function isFreeEnrollable(kind: ShopItemKind, source: ShopSource): boolean {
  return source.price.free && kind !== "consultation";
}

/**
 * Detail pages: "buy now" for purchasable items, or "start learning for free" for free ones, above
 * the wishlist and cart controls. Customers who already have active access get "continue learning"
 * instead.
 */
export function purchaseActionsFor(kind: ShopItemKind, source: ShopSource) {
  const item = toShopItem(kind, source);
  const free = isFreeEnrollable(kind, source);
  return (
    <PurchaseActions item={item}>
      <div className="flex flex-col gap-3">
        {isPurchasable(kind, source) ? <BuyNowButton item={item} /> : null}
        {free ? <EnrollFreeButton item={item} /> : null}
        {/* The enrol link only leads back to this page, so the button above replaces it here. */}
        {free ? <CardActions item={item} purchasable={false} free={false} /> : actionsFor(kind, source)}
      </div>
    </PurchaseActions>
  );
}
