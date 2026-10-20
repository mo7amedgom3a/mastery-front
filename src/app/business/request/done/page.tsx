import type { Metadata } from "next";

import { RequestDonePage } from "@/features/business-request/done-page";

export const metadata: Metadata = { title: "تم استلام طلبك" };

export default function Page() {
  return <RequestDonePage />;
}
