"use client";

import { GraduationCap } from "lucide-react";

import { cn } from "@/lib/cn";
import type { ShopItem } from "@/lib/shop/store";

import { useEnrollFree } from "../api/use-enroll-free";
import { CheckoutRedirectOverlay } from "./checkout-redirect-overlay";

/**
 * Joins a free product straight away: no cart and no payment page. Guests are sent to sign in and
 * come back to this page; pressing twice reuses the same enrollment (one idempotency key per product).
 */
export function EnrollFreeButton({ item }: { item: ShopItem }) {
  const enrollment = useEnrollFree();

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => void enrollment.start(item)}
        disabled={enrollment.busy}
        aria-busy={enrollment.busy}
        className={cn("ma-btn ma-btn--primary ma-btn--block gap-2", enrollment.busy && "is-loading")}
      >
        <GraduationCap aria-hidden="true" className="size-5 fill-none" />
        ابدأ التعلّم مجاناً
      </button>
      {enrollment.error ? (
        <p role="alert" className="m-0 border-s-4 border-pink ps-3 text-sm leading-6 font-medium">
          {enrollment.error}
        </p>
      ) : null}
      <CheckoutRedirectOverlay
        phase={enrollment.phase}
        preparingText="جارٍ تسجيلك…"
        redirectingText="تمّ تسجيلك! جارٍ فتح المحتوى…"
      />
    </div>
  );
}
