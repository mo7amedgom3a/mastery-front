import type { Metadata } from "next";

import { NotificationList } from "@/features/notifications/notification-list";
import { StudentPageHeader } from "@/features/student-dashboard/components/student-page-header";

export const metadata: Metadata = { title: "الإشعارات" };

export default function Page() {
  return (
    <section aria-labelledby="student-notifications-title">
      <StudentPageHeader id="student-notifications-title" title="الإشعارات" />
      <div className="rounded-panel border border-line bg-surface p-2">
        <NotificationList limit={50} />
      </div>
    </section>
  );
}
