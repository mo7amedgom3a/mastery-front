import type { Metadata } from "next";

import { ApplyDonePage } from "@/features/marketer-application/done-page";

export const metadata: Metadata = { title: "تم استلام طلبك" };

export default function Page() {
  return <ApplyDonePage />;
}
