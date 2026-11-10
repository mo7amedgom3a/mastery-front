"use client";

import { TicketPercent } from "lucide-react";

import { useCheckoutIncentives } from "@/features/checkout/model/incentives-store";
import type { AnnouncementCoupon, AnnouncementItem } from "@/lib/api/announcements";

import { couponHighlight } from "../model/bar";
import { useAnnouncementBars } from "./announcements-context";

/** A coupon from the announcement bar that this product can use: the item points at it, or the coupon has no product scope. */
function couponFor(items: AnnouncementItem[], code: string, kind: string, id: number): AnnouncementCoupon | null {
  const slug = `${kind}-${id}`;
  for (const item of items) {
    const coupon = item.coupon;
    if (!coupon || coupon.code.toUpperCase() !== code.toUpperCase()) continue;
    if (item.target?.kind === "product" && item.target.slug === slug) return coupon;
    const unscoped = coupon.product_ids.length === 0 && coupon.product_types.length === 0 && !coupon.category_scoped;
    if (unscoped || coupon.product_types.includes(kind)) return coupon;
  }
  return null;
}

/**
 * "كوبون EXCEL30 مفعّل — خصم 30% عند الدفع" on a product page after the visitor copied or followed a bar
 * coupon. Informational only: the cart quote is the source of truth for the final price.
 */
export function ActiveCouponChip({ kind, id }: { kind: string; id: number }) {
  const code = useCheckoutIncentives((state) => state.couponCode);
  const bars = useAnnouncementBars();
  if (!code) return null;
  const coupon = couponFor(bars.flatMap((bar) => bar.items), code, kind, id);
  if (!coupon) return null;

  return (
    <p className="m-0 mt-3 flex items-center gap-2 rounded-control border border-dashed border-accent/60 bg-accent/10 px-3 py-2 text-sm font-medium">
      <TicketPercent aria-hidden="true" className="size-4 shrink-0 text-accent" />
      <span>
        كوبون{" "}
        <bdi dir="ltr" className="font-bold">
          {coupon.code}
        </bdi>{" "}
        مفعّل — {couponHighlight(coupon)} عند الدفع
      </span>
    </p>
  );
}
