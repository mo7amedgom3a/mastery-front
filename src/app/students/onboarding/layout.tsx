import type { Metadata } from "next";
import type { ReactNode } from "react";

import { OnboardingChrome } from "@/features/onboarding/components/onboarding-chrome";

export const metadata: Metadata = { title: "أعِدّ ملفك" };

/**
 * A focused frame for onboarding: no site navigation, just the logo, "skip" and the progress bar.
 * The layout stays mounted between steps, so the progress bar animates from step to step.
 */
export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <OnboardingChrome />
      <main id="main" tabIndex={-1} className="outline-none">
        <div className="ma-container py-10 md:py-14">{children}</div>
      </main>
    </>
  );
}
