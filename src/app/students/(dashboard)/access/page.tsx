import type { Metadata } from "next";

import { ShopPageHeader } from "@/components/shop/shop-page-header";
import { AccessPage } from "@/features/orders/access-page";

export const metadata: Metadata = { title: "وصولي" };

export default function Page() {
  return (
    <>
      <ShopPageHeader id="student-access-title" title="وصولي" />
      <section aria-labelledby="student-access-title" className="ma-section pt-8 md:pt-10">
        <div className="ma-container">
          <AccessPage />
        </div>
      </section>
    </>
  );
}
