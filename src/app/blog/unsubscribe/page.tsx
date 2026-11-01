import type { Metadata } from "next";

import { UnsubscribeCard } from "@/features/blog/components/unsubscribe-card";

export const metadata: Metadata = {
  title: "إلغاء الاشتراك",
  robots: { index: false, follow: false },
};

function tokenOf(value: string | string[] | undefined): string | null {
  const token = Array.isArray(value) ? value[0] : value;
  return token?.trim() || null;
}

export default async function BlogUnsubscribeRoute({ searchParams }: PageProps<"/blog/unsubscribe">) {
  const params = await searchParams;
  return (
    <>
      <UnsubscribeCard token={tokenOf(params.token)} />
    </>
  );
}
