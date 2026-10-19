import type { Metadata } from "next";

import { StudentPageHeader } from "@/features/student-dashboard/components/student-page-header";
import { MySubscriptionPage } from "@/features/subscriptions/my-subscription-page";

export const metadata: Metadata = { title: "اشتراكي" };

export default function Page() {
  return (
    <section aria-labelledby="student-subscription-title">
      <StudentPageHeader
        id="student-subscription-title"
        title="اشتراكي"
        lead="باقتك وموعد تجديدها، والبرامج التي فتحها لك اشتراكك، ورصيد استشاراتك مع الخبراء."
      />
      <MySubscriptionPage />
    </section>
  );
}
