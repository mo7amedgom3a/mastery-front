import Image from "next/image";

import { ButtonLink } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { formatDate } from "@/lib/format";

import { startsWithLatin } from "../model/products";
import type { LearningProgram } from "../model/learning";
import { ContinueLearningButton } from "./continue-learning-button";
import { SegmentedProgress } from "./segmented-progress";

type ResumeLearningHeroProps = {
  program: LearningProgram | null;
};

/** The demo's coral «تابع من حيث توقفت» hero, fed by live LMS progress or the owned snapshot. */
export function ResumeLearningHero({ program }: ResumeLearningHeroProps) {
  if (!program) return <StartLearningHero />;

  const percent = program.progress;
  const latin = startsWithLatin(program.title);
  // Bundles and packages open their contents, not the LMS.
  const launchable = Boolean(program.entitlementId) && program.status !== "expired" && !program.detailsHref;

  return (
    <section
      aria-labelledby="resume-learning-title"
      className="flex min-h-[clamp(280px,34vh,400px)] flex-col gap-6 rounded-panel bg-coral p-6 text-ink md:p-8"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm font-medium">
        <span>تابع من حيث توقفت</span>
        <span>{program.lastActivity ? `آخر نشاط ${formatDate(program.lastActivity)}` : "جاهز للبدء"}</span>
      </div>

      <div className="flex flex-1 flex-col gap-6 md:flex-row md:items-stretch md:gap-8">
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <div className="flex flex-1 flex-col justify-end gap-2">
            <h2
              id="resume-learning-title"
              dir={latin ? "ltr" : "auto"}
              className={`m-0 max-w-[18ch] text-3xl leading-[1.12] font-bold tracking-tight md:text-5xl ${latin ? "text-right" : ""}`}
            >
              {program.title}
            </h2>
            <p className="m-0 text-[15px] leading-7 text-ink/75">
              {program.typeLabel}
              {program.instructor ? (
                <>
                  {" "}
                  مع <bdi>{program.instructor}</bdi>
                </>
              ) : null}
              {program.status === "completed" ? " · مكتمل" : null}
              {program.status === "expired" ? " · انتهى الوصول" : null}
            </p>
          </div>

          <div className="flex items-center gap-4 md:gap-6">
            <span dir="ltr" className="shrink-0 text-4xl leading-none font-bold tabular-nums md:text-5xl">
              {percent}%
            </span>
            <SegmentedProgress value={percent} label={`تقدّمك في ${program.title}`} className="flex-1" />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {program.detailsHref ? (
              <ButtonLink href={program.detailsHref} variant="on-color" size="lg" block={false}>
                عرض التفاصيل
              </ButtonLink>
            ) : launchable ? (
              <ContinueLearningButton
                entitlementId={program.entitlementId as string}
                title={program.title}
                variant="on-color"
                size="lg"
                block={false}
                label={program.status === "completed" ? "راجع المحتوى" : "كمّل التعلّم"}
              />
            ) : null}
            <ButtonLink
              href={routes.studentAccess}
              variant="ghost"
              size="lg"
              className="bg-ink/10 text-ink hover:bg-ink/20"
            >
              كل برامجي
            </ButtonLink>
          </div>
        </div>

        {program.image ? (
          <div className="relative aspect-[16/10] w-full shrink-0 self-center overflow-hidden rounded-panel md:w-[34%] md:min-w-[180px] md:max-w-[300px]">
            <Image
              src={program.image}
              alt=""
              fill
              sizes="(min-width: 768px) 300px, 100vw"
              className="object-cover"
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}

function StartLearningHero() {
  return (
    <section
      aria-labelledby="start-learning-title"
      className="flex min-h-[280px] flex-col justify-center gap-5 rounded-panel bg-coral p-6 text-ink md:p-8"
    >
      <div className="flex flex-col gap-2">
        <h2 id="start-learning-title" className="m-0 text-3xl leading-[1.2] font-bold md:text-4xl">
          ابدأ أول برنامج
        </h2>
        <p className="m-0 max-w-[52ch] text-[15px] leading-7 text-ink/75">
          اختر دورة أو دبلوماً أو باقة، وسيظهر تقدّمك هنا.
        </p>
      </div>
      <ButtonLink href={routes.search} variant="on-color" size="lg" className="self-start">
        تصفّح البرامج
      </ButtonLink>
    </section>
  );
}
