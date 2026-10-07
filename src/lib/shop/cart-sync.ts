"use client";

import { ApiError } from "@/lib/api/client";
import { addCartItem, getCart, removeCartItem, type CartResponse } from "@/lib/api/commerce";
import { fromMinor } from "@/lib/format";

import { resolveCatalogProductId, shopItemHref, shopKeyFromSlug } from "./catalog-ids";
import { parseShopKey } from "./contract";
import { useShopStore, type CartLine } from "./store";

/**
 * The local cart mirrors the account cart once signed in. Lines keep what the browser already knew
 * about them (artwork, link); everything else, and which lines exist at all, comes from the account.
 */
export function mirrorAccountCart(cart: CartResponse, previous: readonly CartLine[]): CartLine[] {
  const known = new Map(previous.map((line) => [line.key, line]));
  return (cart.lines ?? []).flatMap((line, index) => {
    const key = shopKeyFromSlug(line.slug);
    const parsed = key ? parseShopKey(key) : null;
    if (!key || !parsed) return [];
    const before = known.get(key);
    return [
      {
        key,
        kind: parsed.kind,
        id: parsed.id,
        title: line.title ?? before?.title ?? line.slug,
        href: before?.href ?? shopItemHref(parsed.kind, parsed.id),
        image: before?.image ?? null,
        priceAmount: fromMinor(line.unit_amount_minor),
        addedAt: before?.addedAt ?? index,
        productId: line.product_id,
        cartItemId: line.cart_item_id,
      },
    ];
  });
}

/** 404: not a priced catalog product. 409: not purchasable. Neither is worth logging. */
function expected(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 404 || error.status === 409);
}

function listTitles(lines: readonly CartLine[]): string {
  return lines.map((line) => `«${line.title}»`).join("، ");
}

let syncing: Promise<void> | null = null;

/**
 * Run whenever the session becomes authenticated, and after anything that changed the account cart
 * elsewhere (a purchase). Lines added as a guest (no `cartItemId` yet) are added to the account
 * cart; lines that were on the account but are gone now (bought, removed on another device) are
 * dropped. The account cart then replaces the local one.
 */
export function syncAccountCart(): Promise<void> {
  syncing ??= (async () => {
    const shop = useShopStore.getState();
    try {
      let cart = await getCart();
      const onAccount = new Set((cart.lines ?? []).map((line) => shopKeyFromSlug(line.slug)));
      const guestLines = useShopStore.getState().cart.filter((line) => !line.cartItemId && !onAccount.has(line.key));
      const failed: CartLine[] = [];
      // One at a time: the backend replaces a line's quantity, so parallel writes gain nothing.
      for (const line of guestLines) {
        try {
          cart = await addCartItem(await resolveCatalogProductId(line), 1);
        } catch (error) {
          if (!expected(error)) console.error("[cart] merge failed", line.key, error);
          failed.push(line);
        }
      }
      shop.replaceCart(mirrorAccountCart(cart, useShopStore.getState().cart));
      shop.setCartNotice(
        failed.length > 0 ? `لم نتمكّن من نقل ${listTitles(failed)} إلى سلة حسابك: لم يعد متاحاً للشراء.` : null,
      );
      shop.bumpAccountCart();
    } catch (error) {
      // Signed out meanwhile, or the API is down: the local cart stays as it is until the next sign-in.
      if (!(error instanceof ApiError && error.status === 401)) console.error("[cart] sync failed", error);
    } finally {
      syncing = null;
    }
  })();
  return syncing;
}

/** Signed in: puts a line just added locally on the account cart too; takes it back out if refused. */
export async function pushCartLine(line: CartLine): Promise<void> {
  const shop = useShopStore.getState();
  try {
    const productId = await resolveCatalogProductId(line);
    const cart = await addCartItem(productId, 1);
    const added = cart.lines?.find((entry) => entry.product_id === productId);
    shop.setCartLineAccount(line.key, productId, added?.cart_item_id);
    shop.bumpAccountCart();
  } catch (error) {
    if (!expected(error)) console.error("[cart] add failed", line.key, error);
    shop.removeFromCart(line.key);
    shop.setCartNotice(`تعذّرت إضافة «${line.title}» إلى السلة: غير متاح للشراء حالياً.`);
  }
}

/** Signed in: removes a line from the account cart (already removed locally). */
export async function dropCartLine(line: CartLine): Promise<void> {
  try {
    let cartItemId = line.cartItemId;
    if (!cartItemId) {
      const cart = await getCart();
      cartItemId = cart.lines?.find((entry) => shopKeyFromSlug(entry.slug) === line.key)?.cart_item_id;
    }
    if (cartItemId) await removeCartItem(cartItemId);
  } catch (error) {
    if (!(error instanceof ApiError && error.status === 404)) console.error("[cart] remove failed", line.key, error);
  } finally {
    useShopStore.getState().bumpAccountCart();
  }
}
