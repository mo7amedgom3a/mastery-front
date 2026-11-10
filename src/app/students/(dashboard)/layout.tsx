import type { ReactNode } from "react";

import { StudentShell } from "@/features/student-dashboard/components/student-shell";

/**
 * The signed-in student area gets the demo-style app shell — a full-height sidebar and a slim
 * topbar — instead of the marketing header/footer, so the whole viewport is available to the
 * dashboard and its pages.
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <StudentShell>{children}</StudentShell>;
}
