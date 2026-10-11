import type { Metadata } from "next";

import { StudentPageHeader } from "@/features/student-dashboard/components/student-page-header";
import { ProfilePage } from "@/features/student-profile/profile-page";

export const metadata: Metadata = { title: "الملف الشخصي" };

export default function Page() {
  return (
    <section aria-labelledby="student-profile-title">
      <StudentPageHeader
        id="student-profile-title"
        title="الملف الشخصي"
        lead="بياناتك وصورتك، وما أخبرتنا به عن أهدافك ومهاراتك."
      />
      <ProfilePage />
    </section>
  );
}
