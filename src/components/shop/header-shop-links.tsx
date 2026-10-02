"use client";

import { AnimatePresence, motion } from "motion/react";
import type { Route } from "next";
import { useEffect, useRef, type ReactNode } from "react";

import { CartIcon, type AnimatedIconHandle } from "@/components/icons/animated";
import { HeartFillIcon } from "@/components/icons/heart-fill-icon";
import { AppLink } from "@/components/ui/app-link";
import { routes } from "@/config/routes";
import { useShopHydration, useShopStore } from "@/lib/shop/store";

type CountLinkProps = {
  href: Route;
  label: string;
  count: number;
  onPlay: () => void;
  onStop: () => void;
  children: ReactNode;
};

/** Bare icon link with a count badge that pops in on change. */
function CountLink({ href, label, count, onPlay, onStop, children }: CountLinkProps) {
  return (
    <AppLink
      href={href}
      onMouseEnter={onPlay}
      onMouseLeave={onStop}
      onFocus={onPlay}
      onBlur={onStop}
      aria-label={count > 0 ? `${label} (${count})` : label}
      className="ma-btn ma-btn--bare ma-btn--icon size-11 relative"
    >
      {children}
      <AnimatePresence initial={false}>
        {count > 0 ? (
          <motion.span
            key={count}
            aria-hidden="true"
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.3, opacity: 0 }}
            transition={{ type: "spring", stiffness: 600, damping: 22 }}
            className="absolute -top-0.5 -end-0.5 z-10 grid min-w-5 place-items-center rounded-full bg-accent px-1.5 text-[11px] leading-5 font-bold text-on-accent tabular-nums"
          >
            {count}
          </motion.span>
        ) : null}
      </AnimatePresence>
    </AppLink>
  );
}

/**
 * Plays `play` when `count` goes up through a user action. Restoring saved items from storage is
 * not an "add": the baseline is reset synchronously when rehydration finishes.
 */
function usePlayOnIncrease(count: number, readCount: () => number, play: () => void) {
  const previous = useRef(count);
  useEffect(() => useShopStore.persist.onFinishHydration(() => (previous.current = readCount())), [readCount]);
  useEffect(() => {
    if (count > previous.current) play();
    previous.current = count;
    // `play` only reads a ref; re-running on its identity would replay the animation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);
}

const readWishlistCount = () => useShopStore.getState().wishlist.length;
const readCartCount = () => useShopStore.getState().cart.length;

function WishlistLink() {
  const count = useShopStore((state) => state.wishlist.length);
  const icon = useRef<AnimatedIconHandle>(null);
  const play = () => icon.current?.startAnimation();
  const stop = () => icon.current?.stopAnimation();
  usePlayOnIncrease(count, readWishlistCount, play);

  return (
    <CountLink href={routes.wishlist} label="المفضلة" count={count} onPlay={play} onStop={stop}>
      <HeartFillIcon ref={icon} filled={count > 0} size={20} />
    </CountLink>
  );
}

function CartLink() {
  const count = useShopStore((state) => state.cart.length);
  const icon = useRef<AnimatedIconHandle>(null);
  const play = () => icon.current?.startAnimation();
  const stop = () => icon.current?.stopAnimation();
  usePlayOnIncrease(count, readCartCount, play);

  return (
    <CountLink href={routes.cart} label="السلة" count={count} onPlay={play} onStop={stop}>
      <CartIcon ref={icon} size={20} />
    </CountLink>
  );
}

/** Header cart and wishlist (heart fills once anything is saved) links with live count badges. */
export function HeaderShopLinks() {
  useShopHydration();
  return (
    <>
      <CartLink />
      <WishlistLink />
    </>
  );
}
