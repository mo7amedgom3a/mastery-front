"use client";

import { clsx } from "clsx";
import type { Route } from "next";
import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from "react";

import { AppLink } from "@/components/ui/app-link";
import { useShopHydration, useShopStore, type ShopItem } from "@/lib/shop/store";
import { useShopActions } from "@/lib/shop/use-shop-actions";

export type CardActionsProps = {
  item: ShopItem;
  /** Only priced items can go in the cart; others get the wishlist only. */
  purchasable: boolean;
  /** Free items skip the cart: the card offers "سجّل مجاناً", which opens the item to enrol. */
  free?: boolean;
};

const AnimatedCardActions = lazy(() => import("./card-actions-animated"));

/**
 * One observer for every card: a card's buttons switch to the animated build shortly before the
 * card scrolls into view. Until then they hydrate as plain buttons, so the landing page doesn't pay
 * for ~6 Motion components per card up front (it was the bulk of the hydration work on mobile).
 */
const upgradeCallbacks = new WeakMap<Element, () => void>();
let upgradeObserver: IntersectionObserver | null = null;

function observeForUpgrade(node: Element, upgrade: () => void): () => void {
  upgradeObserver ??= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        upgradeCallbacks.get(entry.target)?.();
        upgradeCallbacks.delete(entry.target);
        upgradeObserver?.unobserve(entry.target);
      }
    },
    { rootMargin: "200px" },
  );
  upgradeCallbacks.set(node, upgrade);
  upgradeObserver.observe(node);
  return () => {
    upgradeCallbacks.delete(node);
    upgradeObserver?.unobserve(node);
  };
}

/**
 * Wishlist + add-to-cart for a product card. Sits above the card's stretched link (`relative z-10`)
 * so clicks don't navigate.
 * - Heart: anyone can save (synced to the account on sign-in).
 * - Cart: anyone can add; signing in is asked for at payment.
 * - Free items: an enrol link to the item instead of the cart.
 */
export function CardActions(props: CardActionsProps) {
  useShopHydration();
  const ref = useRef<HTMLDivElement>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || live) return;
    return observeForUpgrade(node, () => setLive(true));
  }, [live]);

  const upgrade = () => setLive(true);

  return (
    <div ref={ref} onPointerEnter={upgrade} onFocus={upgrade} className="relative z-10 flex items-center gap-2">
      {live ? (
        <Suspense fallback={<StaticCardActions {...props} />}>
          <AnimatedCardActions {...props} />
        </Suspense>
      ) : (
        <StaticCardActions {...props} />
      )}
      {props.free ? (
        <AppLink
          href={props.item.href as Route}
          aria-label={`سجّل مجاناً في «${props.item.title}»`}
          className="ma-btn ma-btn--sm ma-btn--outline min-h-10 px-3 text-[13px]"
        >
          سجّل مجاناً
        </AppLink>
      ) : null}
    </div>
  );
}

/** Same buttons, same icons, same behaviour — just without the Motion animations. */
function StaticCardActions({ item, purchasable }: CardActionsProps) {
  const inCart = useShopStore((state) => state.cart.some((entry) => entry.key === item.key));
  const saved = useShopStore((state) => state.wishlist.some((entry) => entry.key === item.key));
  const { toggleWishlist, toggleCart } = useShopActions();

  return (
    <>
      <button
        type="button"
        onClick={() => toggleWishlist(item)}
        aria-pressed={saved}
        aria-label={saved ? `إزالة «${item.title}» من المفضلة` : `حفظ «${item.title}» في المفضلة`}
        className="ma-btn ma-btn--outline ma-btn--icon ma-btn--sm size-10 min-h-10"
      >
        <StaticIcon className={clsx(saved && "text-accent [&_path]:fill-current")}>
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
        </StaticIcon>
      </button>

      {purchasable ? (
        <button
          type="button"
          onClick={() => toggleCart(item)}
          aria-pressed={inCart}
          aria-label={inCart ? `إزالة «${item.title}» من السلة` : `إضافة «${item.title}» إلى السلة`}
          className={clsx("ma-btn ma-btn--sm min-h-10 gap-1.5 px-3", inCart ? "ma-btn--secondary" : "ma-btn--outline")}
        >
          <span className="relative grid size-[18px] place-items-center">
            <StaticIcon>
              {inCart ? (
                <path d="M4 12 9 17L20 6" />
              ) : (
                <path d="M6.29977 5H21L19 12H7.37671M20 16H8L6 3H3M9 20C9 20.5523 8.55228 21 8 21C7.44772 21 7 20.5523 7 20C7 19.4477 7.44772 19 8 19C8.55228 19 9 19.4477 9 20ZM20 20C20 20.5523 19.5523 21 19 21C18.4477 21 18 20.5523 18 20C18 19.4477 18.4477 19 19 19C19.5523 19 20 19.4477 20 20Z" />
              )}
            </StaticIcon>
          </span>
          <span className="text-[13px]">{inCart ? "في السلة" : "أضف للسلة"}</span>
        </button>
      ) : null}
    </>
  );
}

function StaticIcon({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {children}
    </svg>
  );
}
