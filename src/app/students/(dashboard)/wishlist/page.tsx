import type { Metadata } from "next";
import { Suspense } from "react";

import { StudentPageHeader } from "@/features/student-dashboard/components/student-page-header";
import { WishlistPage, WishlistSkeleton } from "@/features/wishlist/wishlist-page";

export const metadata: Metadata = { title: "المفضلة" };

/** The wishlist inside the dashboard, for a signed-in student (guests use `/wishlist`). */
export default function Page() {
  return (
    <section aria-labelledby="student-wishlist-title">
      <StudentPageHeader
        id="student-wishlist-title"
        title="المفضلة"
        lead="كل ما حفظته في مكان واحد: أضفه إلى السلة، احجز استشارتك، أو عد إليه لاحقاً."
      />
      {/* The filters read the query string, which is only known in the browser. */}
      <Suspense fallback={<WishlistSkeleton />}>
        <WishlistPage />
      </Suspense>
    </section>
  );
}
