import { CardActions } from "@/components/shop/card-actions";
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
