import type { Metadata } from "next";

import { SupportListPage } from "@/features/support/support-list-page";

export const metadata: Metadata = {
  title: "الدعم الفني وتذاكر المساعدة | ماستري أكاديمي",
  description: "متابعة وإدارة تذاكر الدعم الفني والتواصل مع فريق خدمة المستفيدين.",
};

export default function Page() {
  return <SupportListPage />;
}
