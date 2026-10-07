"use client";

import { Zap } from "lucide-react";

import { cn } from "@/lib/cn";
import type { ShopItem } from "@/lib/shop/store";

import { useStartCheckout } from "../api/use-start-checkout";
import { CheckoutRedirectOverlay } from "./checkout-redirect-overlay";

/**
 * Pays for this one product straight away, without touching the cart. Guests are sent to sign in
 * and come back to this page. Pressing twice, or again after coming back from Stripe, resumes the
 * same order (one idempotency key per product).
 */
export function BuyNowButton({ item }: { item: ShopItem }) {
  const checkout = useStartCheckout();

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => void checkout.start({ mode: "product", item })}
        disabled={checkout.busy}
        aria-busy={checkout.busy}
        className={cn("ma-btn ma-btn--primary ma-btn--block gap-2", checkout.busy && "is-loading")}
      >
        <Zap aria-hidden="true" className="size-5 fill-none" />
        اشترِ الآن
      </button>
      {checkout.error ? (
        <p role="alert" className="m-0 border-s-4 border-pink ps-3 text-sm leading-6 font-medium">
          {checkout.error}
        </p>
      ) : null}
      <CheckoutRedirectOverlay phase={checkout.phase} />
    </div>
  );
}
