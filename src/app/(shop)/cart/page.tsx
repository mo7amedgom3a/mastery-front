import type { Metadata } from "next";

import { ShopPageHeader } from "@/components/shop/shop-page-header";
import { CartPage } from "@/features/cart/cart-page";

export const metadata: Metadata = {
  title: "سلة المشتريات",
  description: "راجع مشترياتك من ماستري أكاديمي، أضف قسيمة الخصم، واختر طريقة الدفع.",
  // Personal to each visitor: nothing here for a search index.
  robots: { index: false, follow: false },
};

export default function CartRoute() {
  return (
    <>
      <ShopPageHeader id="cart-title" title="سلة المشتريات" crumb="السلة" />
      <section aria-labelledby="cart-title" className="ma-section pt-8 md:pt-10">
        <div className="ma-container">
          <CartPage />
        </div>
      </section>
    </>
  );
}
