import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ShopPageHeader } from "@/components/shop/shop-page-header";
import { isMockCheckoutEnabled } from "@/config/env";
import { MockGatewayPage } from "@/features/checkout/mock-gateway-page";

export const metadata: Metadata = {
  title: "الدفع",
  robots: { index: false, follow: false },
};

/** MOCK: exists only while checkout is simulated; a 404 wherever mock checkout is off. */
export default function MockGatewayRoute() {
  if (!isMockCheckoutEnabled()) {
    notFound();
  }
  return (
    <>
      <ShopPageHeader id="checkout-pay-title" title="الدفع" />
      <section aria-labelledby="checkout-pay-title" className="ma-section pt-8 md:pt-10">
        <div className="ma-container">
          {/* The order id is read from the query string, which is only known in the browser. */}
          <Suspense fallback={null}>
            <MockGatewayPage />
          </Suspense>
        </div>
      </section>
    </>
  );
}
