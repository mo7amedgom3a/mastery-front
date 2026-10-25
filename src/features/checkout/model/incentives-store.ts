"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { normalizeCouponCode } from "@/features/cart/model/coupons";
import type { CheckoutIncentives } from "@/lib/api/commerce";

type IncentivesState = {
  /** The code the customer entered; kept until removed, even when it doesn't apply. */
  couponCode: string | null;
  /** Vouchers chosen to pay with. Null until the customer (or the first quote) decides. */
  voucherIds: string[] | null;
  /** Vouchers the cart has already offered, so one the customer unticked is not ticked again. */
  seenVoucherIds: string[];
  setCoupon: (code: string | null) => void;
  setVoucherIds: (ids: string[]) => void;
  /**
   * A quote listed these spendable vouchers: select the ones not offered before (all of them on the
   * first quote). New referral credit is then spent without the customer opening the voucher list.
   */
  offerVouchers: (ids: string[]) => void;
  /** After a paid order: the coupon and vouchers were used. */
  reset: () => void;
};

/**
 * The cart's coupon and voucher selection, shared by the order summary (quote) and the pay button
 * (checkout). Per tab: sessionStorage, so a refresh keeps it and a new visit starts clean.
 */
export const useCheckoutIncentives = create<IncentivesState>()(
  persist(
    (set) => ({
      couponCode: null,
      voucherIds: null,
      seenVoucherIds: [],
      setCoupon: (code) => set({ couponCode: normalizeCouponCode(code?.replace(/\s+/g, "")) }),
      setVoucherIds: (ids) => set({ voucherIds: ids }),
      offerVouchers: (ids) =>
        set((state) => {
          const fresh = ids.filter((id) => !state.seenVoucherIds.includes(id));
          if (fresh.length === 0) return state;
          return {
            voucherIds: [...(state.voucherIds ?? []), ...fresh],
            seenVoucherIds: [...state.seenVoucherIds, ...fresh],
          };
        }),
      reset: () => set({ couponCode: null, voucherIds: null, seenVoucherIds: [] }),
    }),
    {
      name: "ma-checkout-incentives",
      storage: createJSONStorage(() => sessionStorage),
      partialize: ({ couponCode, voucherIds, seenVoucherIds }) => ({ couponCode, voucherIds, seenVoucherIds }),
    },
  ),
);

/** What the quote and checkout requests carry. */
export function incentivesRequest(state: Pick<IncentivesState, "couponCode" | "voucherIds">): CheckoutIncentives | undefined {
  if (!state.couponCode && !state.voucherIds?.length) return undefined;
  return { coupon_code: state.couponCode, voucher_ids: state.voucherIds?.length ? state.voucherIds : null };
}
