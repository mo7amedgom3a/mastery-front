"use client";

import { Plus } from "lucide-react";
import type { Route } from "next";
import Image from "next/image";

import { Money } from "@/components/shop/money";
import { AppLink } from "@/components/ui/app-link";
import { routes } from "@/config/routes";
import { kindLabel } from "@/lib/shop/labels";
import { useShopStore } from "@/lib/shop/store";

/** Rows shown; the rest are one click away on the wishlist page. */
const LIMIT = 4;

/**
 * Saved items that could join this order: what the visitor put in the wishlist, can be bought, and
 * isn't in the cart yet. Shown from what the browser saved; the quote prices them once added.
 */
export function WishlistSuggestions() {
  const wishlist = useShopStore((state) => state.wishlist);
  const cart = useShopStore((state) => state.cart);
  const addToCart = useShopStore((state) => state.addToCart);

  const inCart = new Set(cart.map((line) => line.key));
  const candidates = wishlist
    .filter((entry) => entry.kind !== "consultation" && entry.priceAmount !== null && !inCart.has(entry.key))
    .toSorted((a, b) => b.addedAt - a.addedAt);
  if (candidates.length === 0) return null;

  return (
    <section aria-labelledby="cart-wishlist-title" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h2 id="cart-wishlist-title" className="m-0 text-xl font-bold">
          من مفضلتك
        </h2>
        <AppLink href={routes.wishlist} prefetch className="ma-link text-sm">
          عرض المفضلة كلها
        </AppLink>
      </div>
      <ul className="m-0 flex list-none flex-col p-0">
        {candidates.slice(0, LIMIT).map((entry) => (
          <li key={entry.key} className="flex items-center gap-3 border-t border-line py-3 last:border-b">
            <div className="relative aspect-[16/10] w-20 shrink-0 overflow-hidden bg-surface-alt">
              {entry.image ? <Image src={entry.image} alt="" fill sizes="80px" className="object-cover" /> : null}
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
              <AppLink href={entry.href as Route} className="line-clamp-1 font-medium text-fg no-underline hover:underline">
                {entry.title}
              </AppLink>
              <span className="text-sm text-fg-muted">
                {kindLabel[entry.kind]}
                {entry.priceAmount !== null ? (
                  <>
                    {" · "}
                    <Money amount={entry.priceAmount} />
                  </>
                ) : null}
              </span>
            </div>
            <button
              type="button"
              onClick={() => addToCart(entry)}
              aria-label={`إضافة «${entry.title}» إلى السلة`}
              className="ma-btn ma-btn--soft ma-btn--sm min-h-11 shrink-0 gap-1.5"
            >
              <Plus aria-hidden="true" className="size-4 fill-none" />
              أضف
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
