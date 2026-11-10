import type { Metadata } from "next";
import { connection } from "next/server";
import { notFound } from "next/navigation";

import { getBundleDetail } from "@/features/bundle-detail/api/get-bundle-detail";
import { compositionLabel } from "@/features/bundle-detail/model/mappers";
import { BundleMembersSection } from "@/features/bundle-detail/sections/bundle-members-section";
import { ProgramMemberAction } from "@/features/student-dashboard/components/program-member-action";
import { StudentProgramDetail } from "@/features/student-dashboard/program-detail";

export const metadata: Metadata = { title: "تفاصيل الحزمة" };

/** A bundle the student can open: every program inside it, with its own details. */
export default async function Page({ params }: PageProps<"/students/learning/bundle/[slug]">) {
  await connection();
  const { slug } = await params;
  const bundle = await getBundleDetail(slug);
  if (!bundle) {
    notFound();
  }
  const composition = compositionLabel(bundle.composition);

  return (
    <StudentProgramDetail
      title={bundle.title}
      typeLabel="حزمة"
      image={bundle.image}
      summary={bundle.summary}
      meta={[composition ?? "", bundle.access ?? ""]}
    >
      <BundleMembersSection
        groups={bundle.groups}
        lead={composition}
        showPrices={false}
        action={(member) => (
          <ProgramMemberAction slug={member.slug} kind={member.kind} title={member.title} href={member.href} />
        )}
      />
    </StudentProgramDetail>
  );
}
