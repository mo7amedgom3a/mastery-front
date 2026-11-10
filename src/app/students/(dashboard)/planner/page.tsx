import type { Metadata } from "next";
import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { StudentPageHeader } from "@/features/student-dashboard/components/student-page-header";
import { PlannerPage } from "@/features/student-planner/planner-page";

export const metadata: Metadata = { title: "خطة التعلّم" };

export default function Page() {
  return (
    <section aria-labelledby="student-planner-title">
      <StudentPageHeader
        id="student-planner-title"
        title="خطة التعلّم"
        lead="تقويمك للتعلّم: مهامك وملاحظاتك ووقت مذاكرتك، مع محاضرات دبلوماتك المباشرة واستشاراتك القادمة."
      />
      {/* The page reads `?date=` from the URL, which needs a Suspense boundary. */}
      <Suspense fallback={<Skeleton className="h-96" />}>
        <PlannerPage />
      </Suspense>
    </section>
  );
}
