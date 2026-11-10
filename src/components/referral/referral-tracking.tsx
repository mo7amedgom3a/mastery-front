"use client";

import { CheckCircle2, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";

import { useCheckoutIncentives } from "@/features/checkout/model/incentives-store";
import { captureReferral, readStoredReferralInfo, resolveReferral, type ResolvedReferral } from "@/lib/referral";

/** Keeps the visitor's `?ref=` code and applies the referral discount coupon. */
export function ReferralTracking() {
  const [banner, setBanner] = useState<ResolvedReferral | null>(null);

  useEffect(() => {
    captureReferral();
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get("ref")?.trim();

    if (refCode) {
      void resolveReferral(refCode).then((info) => {
        if (info && info.valid) {
          setBanner(info);
          if (info.coupon_code || info.referral_code) {
            useCheckoutIncentives.getState().setCoupon(info.coupon_code || info.referral_code);
          }
        }
      });
    } else {
      const stored = readStoredReferralInfo();
      if (stored && stored.valid && stored.coupon_code) {
        const currentCoupon = useCheckoutIncentives.getState().couponCode;
        if (!currentCoupon) {
          useCheckoutIncentives.getState().setCoupon(stored.coupon_code || stored.referral_code);
        }
      }
    }
  }, []);

  return (
    <>
      {banner ? (
        <aside
          aria-label="إشعار خصم الإحالة"
          className="relative z-50 flex items-center justify-between gap-3 bg-gradient-to-r from-accent to-accent-strong px-4 py-2.5 text-xs sm:text-sm font-medium text-white shadow-md animate-in fade-in slide-in-from-top duration-300"
        >
          <div className="ma-container mx-auto flex items-center justify-between gap-3 w-full">
            <div className="flex items-center gap-2">
              <span className="grid size-6 place-items-center rounded-full bg-white/20">
                <Sparkles className="size-3.5" />
              </span>
              <span>
                مرحباً بك! تم تفعيل خصم <strong>{banner.discount_percent}%</strong> على مشترياتك عبر إحالة{" "}
                <strong>{banner.partner_name}</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={() => setBanner(null)}
              aria-label="إغلاق الإشعار"
              className="grid size-6 place-items-center rounded-full text-white/80 hover:bg-white/20 hover:text-white transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>
        </aside>
      ) : null}
    </>
  );
}
