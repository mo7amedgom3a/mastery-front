import type { Metadata } from "next";

import { StudentPageHeader } from "@/features/student-dashboard/components/student-page-header";
import { CartPage } from "@/features/cart/cart-page";

export const metadata: Metadata = { title: "سلة المشتريات" };

/** The cart inside the dashboard, for a signed-in student (guests use `/cart`). */
export default function Page() {
  return (
    <section aria-labelledby="student-cart-title">
      <StudentPageHeader id="student-cart-title" title="سلة المشتريات" />
      <CartPage />
    </section>
  );
}
