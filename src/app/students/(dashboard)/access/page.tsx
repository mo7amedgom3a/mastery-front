import type { Metadata } from "next";
import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { StudentPageHeader } from "@/features/student-dashboard/components/student-page-header";
import { AccessPage } from "@/features/orders/access-page";

export const metadata: Metadata = { title: "تعلّمي" };

export default function Page() {
  return (
    <section aria-labelledby="student-access-title">
      <StudentPageHeader
        id="student-access-title"
        title="تعلّمي"
        lead="كل ما اشتريته في مكان واحد: الدورات والدبلومات والباقات والاستشارات، ومدة وصولك لكل منها."
      />
      {/* The type filter reads the query string, which is only known in the browser. */}
      <Suspense fallback={<Skeleton className="h-96" />}>
        <AccessPage />
      </Suspense>
    </section>
  );
}
