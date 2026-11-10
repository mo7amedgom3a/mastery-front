import type { Metadata } from "next";
import { connection } from "next/server";
import { notFound } from "next/navigation";

import { getB2CPackageDetail } from "@/features/package-detail/api/get-package-detail-b2c";
import { itemsLabel } from "@/features/package-detail/model/facts";
import { PackageContentsSection } from "@/features/package-detail/sections/package-contents-section";
import { ProgramMemberAction } from "@/features/student-dashboard/components/program-member-action";
import { StudentProgramDetail } from "@/features/student-dashboard/program-detail";

export const metadata: Metadata = { title: "محتوى الباقة" };

/** A package the student can open: every course and diploma inside it, with its own details. */
export default async function Page({ params }: PageProps<"/students/learning/package/[id]">) {
  await connection();
  const { id } = await params;
  const packageId = Number(id);
  if (!Number.isSafeInteger(packageId) || packageId <= 0) {
    notFound();
  }
  const data = await getB2CPackageDetail(packageId);
  // Only published packages have a student page; drafts are not enumerable from the dashboard.
  if (!data || !data.product.indexable) {
    notFound();
  }
  const product = data.product;
  const items = itemsLabel(product);

  return (
    <StudentProgramDetail
      title={product.title}
      typeLabel="باقة"
      image={product.image}
      summary={product.summary}
      meta={[items ?? "", product.duration ?? ""]}
    >
      <PackageContentsSection
        items={product.items}
        title="محتوى الباقة"
        lead={items}
        showPrices={false}
        action={(item) => (
          <ProgramMemberAction slug={item.key} kind={item.kind} title={item.title} href={item.href} />
        )}
      />
    </StudentProgramDetail>
  );
}
