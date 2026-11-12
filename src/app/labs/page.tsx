import type { Metadata } from "next";

import { LabsHub } from "@/features/labs/components/labs-hub";

export const metadata: Metadata = {
  title: "المختبرات العملية",
  description: "تعلّم بالممارسة: محاكاة لبيئات عمل حقيقية في التسويق والمبيعات والموارد البشرية مع تقييم فوري.",
};

export default function LabsRoute() {
  return <LabsHub />;
}
