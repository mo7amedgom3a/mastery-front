"use client";

import { useEffect } from "react";

import { useCheckoutIncentives } from "@/features/checkout/model/incentives-store";

const CODE_RE = /^[A-Za-z0-9][A-Za-z0-9_-]{2,39}$/;

/**
 * `?coupon=CODE` on any page (announcement bar links, shared campaign links) keeps the code for checkout.
 * The backend still validates it at quote time; this only pre-fills the cart's coupon.
 */
export function CouponLinkTracking() {
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("coupon")?.trim();
    if (code && CODE_RE.test(code)) {
      useCheckoutIncentives.getState().setCoupon(code);
    }
  }, []);
  return null;
}
