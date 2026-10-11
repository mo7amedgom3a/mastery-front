import type { Metadata } from "next";

import { DashboardHome } from "@/features/student-dashboard/dashboard-home";

export const metadata: Metadata = { title: "لوحتي" };

export default function Page() {
  return <DashboardHome />;
}
