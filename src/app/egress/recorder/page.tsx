import type { Metadata } from "next";

import { RecorderEntry } from "@/features/consultation-recorder/recorder-entry";

// Not for people: LiveKit egress opens it (with a recorder token) to record a consultation.
export const metadata: Metadata = {
  title: "Session recorder",
  robots: { index: false, follow: false },
  // Stops Chrome offering to translate the page into the recording.
  other: { google: "notranslate" },
};

export default function Page() {
  return <RecorderEntry />;
}
