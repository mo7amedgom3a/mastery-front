"use client";

import { clsx } from "clsx";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef } from "react";

import { CartIcon, CheckIcon, type AnimatedIconHandle } from "@/components/icons/animated";
import { HeartFillIcon } from "@/components/icons/heart-fill-icon";
import { useShopStore } from "@/lib/shop/store";
import { useShopActions } from "@/lib/shop/use-shop-actions";

import type { CardActionsProps } from "./card-actions";

const swap = {
  initial: { scale: 0.4, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.4, opacity: 0 },
  transition: { type: "spring", stiffness: 520, damping: 26 },
} as const;

/**
 * The animated build of the card buttons (see `CardActions`, which loads this lazily).
 * - Heart: the coral fill rises and the heart beats.
 * - Cart: the cart hops on hover and swaps to a drawn check once the item is in the cart.
 */
export default function AnimatedCardActions({ item, purchasable }: CardActionsProps) {
  const inCart = useShopStore((state) => state.cart.some((entry) => entry.key === item.key));
  const saved = useShopStore((state) => state.wishlist.some((entry) => entry.key === item.key));
  const { toggleWishlist, toggleCart } = useShopActions();

  const heart = useRef<AnimatedIconHandle>(null);
  const cart = useRef<AnimatedIconHandle>(null);
  const check = useRef<AnimatedIconHandle>(null);
  const playHeart = () => heart.current?.startAnimation();
  const stopHeart = () => heart.current?.stopAnimation();
  const playCart = () => cart.current?.startAnimation();
  const stopCart = () => cart.current?.stopAnimation();

  // Draw the check whenever the item lands in the cart.
  useEffect(() => {
    if (inCart) check.current?.startAnimation();
  }, [inCart]);

  const onWishlist = () => {
    if (toggleWishlist(item)) playHeart();
  };

  return (
    <>
      <motion.button
        type="button"
        onClick={onWishlist}
        onMouseEnter={playHeart}
        onMouseLeave={stopHeart}
        onFocus={playHeart}
        onBlur={stopHeart}
        aria-pressed={saved}
        aria-label={saved ? `إزالة «${item.title}» من المفضلة` : `حفظ «${item.title}» في المفضلة`}
        whileTap={{ scale: 0.85 }}
        className="ma-btn ma-btn--bare ma-btn--icon ma-btn--sm size-10 min-h-10"
      >
        <HeartFillIcon ref={heart} filled={saved} size={18} />
      </motion.button>

      {purchasable ? (
        <motion.button
          type="button"
          onClick={() => toggleCart(item)}
          onMouseEnter={playCart}
          onMouseLeave={stopCart}
          onFocus={playCart}
          onBlur={stopCart}
          aria-pressed={inCart}
          aria-label={inCart ? `إزالة «${item.title}» من السلة` : `إضافة «${item.title}» إلى السلة`}
          whileTap={{ scale: 0.94 }}
          className={clsx("ma-btn ma-btn--sm min-h-10 gap-1.5 px-3", inCart ? "ma-btn--secondary" : "ma-btn--soft")}
        >
          <span className="relative grid size-[18px] place-items-center">
            <AnimatePresence mode="popLayout" initial={false}>
              {inCart ? (
                <motion.span key="check" {...swap} className="absolute inset-0 grid place-items-center">
                  <CheckIcon ref={check} size={18} />
                </motion.span>
              ) : (
                <motion.span key="cart" {...swap} className="absolute inset-0 grid place-items-center">
                  <CartIcon ref={cart} size={18} />
                </motion.span>
              )}
            </AnimatePresence>
          </span>
          <span className="text-[13px]">{inCart ? "في السلة" : "أضف للسلة"}</span>
        </motion.button>
      ) : null}
    </>
  );
}
