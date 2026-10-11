"use client";

import { PlayCircle } from "lucide-react";
import type { ReactNode } from "react";

import { ButtonLink } from "@/components/ui/button";
import { routes } from "@/config/routes";
import type { ShopItem } from "@/lib/shop/store";
import { useIsOwned } from "@/lib/shop/use-owned-products";

/**
 * Detail-page purchase controls. A customer with active access to the item gets a way back to their
 * learning instead of "buy now" and the cart; everyone else gets `children` (the purchase controls).
 */
export function PurchaseActions({ item, children }: { item: ShopItem; children: ReactNode }) {
  const owned = useIsOwned(item);
  if (!owned) return children;

  return (
    <div className="flex flex-col gap-2">
      <ButtonLink href={routes.studentAccess} variant="primary" block className="gap-2">
        <PlayCircle aria-hidden="true" className="size-5 fill-none" />
        كمّل تعلّمك
      </ButtonLink>
      <p className="m-0 text-sm text-fg-muted">أنت مشترك بالفعل، ووصولك مفعّل.</p>
    </div>
  );
}
