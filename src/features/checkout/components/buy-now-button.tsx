"use client";

import { Zap } from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";

import type { ShopItem } from "@/lib/shop/store";

import { useStartCheckout } from "../api/use-start-checkout";

// Loaded on the first press: product pages don't ship the payment picker or React Query otherwise.
const PayDialog = dynamic(() => import("./pay-dialog"), { ssr: false });

/**
 * Pays for this one product straight away, without touching the cart. The button opens a dialog to
 * choose how to pay (card via Stripe, or Tamara instalments in the UAE), then hands the order to
 * that provider. Guests are sent to sign in and come back to this page. Pressing twice, or again
 * after coming back from the payment page, resumes the same order (one idempotency key per product
 * and provider).
 */
export function BuyNowButton({ item }: { item: ShopItem }) {
  const [open, setOpen] = useState(false);
  const checkout = useStartCheckout();

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => {
          checkout.clearError();
          setOpen(true);
        }}
        aria-haspopup="dialog"
        className="ma-btn ma-btn--primary ma-btn--block gap-2"
      >
        <Zap aria-hidden="true" className="size-5 fill-none" />
        اشترِ الآن
      </button>
      {open ? <PayDialog item={item} checkout={checkout} onClose={() => setOpen(false)} /> : null}
    </div>
  );
}
