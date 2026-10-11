import type { Metadata } from "next";

import { OnboardingStartPage } from "@/features/onboarding/start-page";

export const metadata: Metadata = { title: "نقطة البداية المقترحة لك" };

export default function Page() {
  return <OnboardingStartPage />;
}
