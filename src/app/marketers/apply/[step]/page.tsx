import { notFound } from "next/navigation";

import { ButtonLink } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { getAffiliatePolicy, getAffiliateProgram } from "@/features/marketer-application/api/program";
import { ApplyStepPage } from "@/features/marketer-application/apply-step-page";
import { isApplyStep } from "@/features/marketer-application/model/steps";

export default async function Page({ params }: PageProps<"/marketers/apply/[step]">) {
  const { step } = await params;
  if (!isApplyStep(step)) notFound();
  // Only the last step shows the policy the applicant accepts.
  const [program, policy] = await Promise.all([
    getAffiliateProgram(),
    step === "policy" ? getAffiliatePolicy() : Promise.resolve(null),
  ]);
  if (!program.applications_open) {
    return (
      <section aria-labelledby="apply-closed-title" className="mx-auto flex w-full max-w-2xl flex-col items-start gap-4">
        <h1 id="apply-closed-title" className="m-0 text-3xl font-bold">باب التقديم مغلق حاليًا</h1>
        <p className="m-0 text-fg-muted">
          نعتذر منك، استقبال طلبات المسوقين الجدد مغلق مؤقتًا. تابع قنواتنا لمعرفة موعد إعادة فتح باب التقديم.
        </p>
        <ButtonLink href={routes.marketers} variant="primary">العودة لبرنامج المسوقين</ButtonLink>
      </section>
    );
  }
  return <ApplyStepPage step={step} policy={policy} />;
}
