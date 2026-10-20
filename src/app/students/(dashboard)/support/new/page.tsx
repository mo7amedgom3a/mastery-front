import type { Metadata } from "next";

import { SupportCreatePage } from "@/features/support/support-create-page";

export const metadata: Metadata = {
  title: "فتح تذكرة دعم جديدة | ماستري أكاديمي",
  description: "تقديم طلب دعم فني أو مالي لفريق خدمة المستفيدين.",
};

export default function Page() {
  return <SupportCreatePage />;
}
