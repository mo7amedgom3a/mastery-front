import type { Metadata } from "next";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { PlannerUnsubscribeCard } from "@/features/student-planner/components/unsubscribe-card";

export const metadata: Metadata = {
  title: "إيقاف تذكيرات خطة التعلّم",
  robots: { index: false, follow: false },
};

function tokenOf(value: string | string[] | undefined): string | null {
  const token = Array.isArray(value) ? value[0] : value;
  return token?.trim() || null;
}

/** One-click opt-out from a planner reminder email; no sign-in needed. */
export default async function PlannerUnsubscribeRoute({ searchParams }: PageProps<"/planner/unsubscribe">) {
  const params = await searchParams;
  return (
    <>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="ma-container py-16 outline-none md:py-24">
        <PlannerUnsubscribeCard token={tokenOf(params.token)} />
      </main>
      <SiteFooter />
    </>
  );
}
