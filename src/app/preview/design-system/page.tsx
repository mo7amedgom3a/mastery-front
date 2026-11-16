import type { Metadata } from "next";

import { SiteHeader } from "@/components/layout/site-header";
import { DesignSystemSpecimen } from "@/features/design-system-test/components/design-system-specimen";

export const metadata: Metadata = {
  title: "نظام التصميم — اختبار الرموز",
  description: "لوحة عينات لرموز نظام التصميم المستخرج من study.emasteryacademy.com.",
  robots: { index: false, follow: false },
};

export default function DesignSystemPreviewPage() {
  return (
    <>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="outline-none">
        <DesignSystemSpecimen />
      </main>
    </>
  );
}
