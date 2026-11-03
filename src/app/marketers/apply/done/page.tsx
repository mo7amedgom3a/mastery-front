import type { Metadata } from "next";

import { getToltPortalUrl } from "@/config/env";
import { ApplyDonePage } from "@/features/marketer-application/done-page";

export const metadata: Metadata = { title: "تم قبولك في البرنامج" };

export default function Page() {
  return <ApplyDonePage portalUrl={getToltPortalUrl()} />;
}
