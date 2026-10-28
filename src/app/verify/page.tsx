import type { Metadata } from "next";

import { routes } from "@/config/routes";
import { baseOpenGraph } from "@/config/site";
import { VerifyPage } from "@/features/verify/verify-page";

const title = "التحقق من الشهادات";
const description = "تحقّق من صحة شهادات ماستري أكاديمي برقم الشهادة المطبوع عليها.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: routes.verify },
  openGraph: { ...baseOpenGraph, url: routes.verify, title, description },
};

export default function Page() {
  return <VerifyPage />;
}
