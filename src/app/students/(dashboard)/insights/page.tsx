import type { Metadata } from "next";
import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { StudentPageHeader } from "@/features/student-dashboard/components/student-page-header";
import { InsightsPage } from "@/features/student-insights/insights-page";

export const metadata: Metadata = { title: "رؤى التعلّم" };

export default function Page() {
  return (
    <section aria-labelledby="student-insights-title">
      <StudentPageHeader
        id="student-insights-title"
        title="رؤى التعلّم"
        lead="تقرير شخصي عنك: متى تتعلّم وكم، وأين تتقدّم، وما الذي يشدّك، وما خطوتك التالية."
      />
      {/* The range lives in `?range=`, which needs a Suspense boundary. */}
      <Suspense fallback={<Skeleton className="h-96" />}>
        <InsightsPage />
      </Suspense>
    </section>
  );
}
