import type { Metadata } from "next";
import { Suspense } from "react";

import { ShopPageHeader } from "@/components/shop/shop-page-header";
import { WishlistPage, WishlistSkeleton } from "@/features/wishlist/wishlist-page";

export const metadata: Metadata = {
  title: "المفضلة",
  description: "الدورات والدبلومات والباقات والاستشارات التي حفظتها في ماستري أكاديمي.",
  // Personal to each visitor: nothing here for a search index.
  robots: { index: false, follow: false },
};

export default function WishlistRoute() {
  return (
    <>
      <ShopPageHeader
        id="wishlist-title"
        title="المفضلة"
        lead="كل ما حفظته في مكان واحد: أضفه إلى السلة، احجز استشارتك، أو عد إليه لاحقاً."
      />
      <section aria-labelledby="wishlist-title" className="ma-section pt-8 md:pt-10">
        <div className="ma-container">
          {/* The filters read the query string, which is only known in the browser. */}
          <Suspense fallback={<WishlistSkeleton />}>
            <WishlistPage />
          </Suspense>
        </div>
      </section>
    </>
  );
}
