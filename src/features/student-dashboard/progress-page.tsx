"use client";

import { useQuery } from "@tanstack/react-query";
import { BookOpenCheck, Trophy } from "lucide-react";
import Image from "next/image";

import { AppLink } from "@/components/ui/app-link";
import { Button, ButtonLink } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/config/routes";
import { commerceQueries } from "@/lib/api/commerce";
import { isLmsReauthError, lmsQueries, type LmsQuiz } from "@/lib/api/lms";
import { formatDate, formatNumber } from "@/lib/format";
import { cn } from "@/lib/cn";

import {
  averageProgress,
  learningPrograms,
  quizStats,
  safeLmsImage,
  type LearningProgram,
} from "./model/learning";
import { useCatalogArtwork } from "./model/use-artwork";
import { ContinueLearningButton } from "./components/continue-learning-button";
import { DashboardPanel } from "./components/dashboard-panel";
import { ProgressTrack } from "./components/progress-track";
import { StatGrid } from "./components/stat-grid";

/** Live learning progress from the LMS, with the real /me/products snapshot as the fallback. */
export function LearningProgressPage() {
  const courses = useQuery(lmsQueries.courses({ page: 1, page_size: 50 }));
  const summary = useQuery(lmsQueries.summary());
  const quizzes = useQuery(lmsQueries.quizzes());
  const owned = useQuery(commerceQueries.ownedProducts({ status: "active", limit: 100 }));

  const ownedProducts = owned.data?.items ?? [];
  const artwork = useCatalogArtwork(ownedProducts.map((product) => product.slug));
  const lmsItems = courses.data?.items ?? [];
  const result = learningPrograms(lmsItems, ownedProducts, artwork);
  const programs = result.items.toSorted((a, b) => (b.lastActivity ?? "").localeCompare(a.lastActivity ?? ""));
  const usingSnapshot = courses.isError && lmsItems.length === 0;
  const average = averageProgress(programs);
  const stats = quizStats(quizzes.data?.items ?? []);
  const reauth =
    isLmsReauthError(courses.error) || isLmsReauthError(summary.error) || isLmsReauthError(quizzes.error);
  const pending = courses.isPending || (courses.isError && owned.isPending);
  const failed = courses.isError && owned.isError;

  return (
    <div className="@container flex flex-col gap-6">
      {courses.isError || summary.isError || quizzes.isError ? (
        <div className="flex flex-col items-start gap-3 rounded-panel border border-line p-5">
          <p className="m-0 font-bold">
            {reauth ? "انتهت جلسة منصة التعلّم" : "تعذّر تحديث بيانات منصة التعلّم"}
          </p>
          <p className="m-0 text-sm text-fg-muted">
            {reauth
              ? "سجّل الدخول من جديد لتحديث جلسة منصة التعلّم، ثم عد إلى هذه الصفحة."
              : usingSnapshot
                ? "نعرض آخر تقدّم محفوظ من حسابك. حاول تحديث الصفحة لاحقاً."
                : "تحقّق من اتصالك، ثم أعد المحاولة."}
          </p>
          {reauth ? (
            <ButtonLink href={routes.loginThen(routes.studentProgress)} variant="primary" size="sm">
              تسجيل الدخول
            </ButtonLink>
          ) : (
            <Button variant="soft" size="sm" onClick={() => void courses.refetch()}>
              إعادة المحاولة
            </Button>
          )}
        </div>
      ) : null}

      <StatGrid
        columns={4}
        stats={[
          {
            label: "متوسط الإنجاز",
            value: pending ? "—" : average === null ? "—" : `${formatNumber(average)}%`,
          },
          { label: "برامج في حسابك", value: pending ? "—" : formatNumber(programs.length) },
          { label: "اختبارات ناجحة", value: quizzes.isPending ? "—" : formatNumber(stats.passed) },
          {
            label: "شهادات في المنصة",
            value: summary.isPending ? "—" : formatNumber(summary.data?.certificates ?? 0),
          },
        ]}
      />

      <DashboardPanel
        id="program-progress-title"
        title="برامجك"
        subtitle={usingSnapshot ? "آخر تقدّم محفوظ من حسابك" : "تقدّمك الحقيقي من منصة التعلّم"}
        action={
          <AppLink href={routes.studentAccess} className="ma-btn ma-btn--ghost ma-btn--sm">
            كل البرامج
          </AppLink>
        }
      >
        {pending ? (
          <div role="status" className="flex flex-col gap-3">
            <span className="sr-only">جارٍ تحميل برامجك…</span>
            {[0, 1, 2].map((index) => (
              <Skeleton key={index} className="h-24" />
            ))}
          </div>
        ) : failed ? (
          <p className="m-0 text-fg-muted">تعذّر تحميل برامجك الآن.</p>
        ) : programs.length === 0 ? (
          <div className="flex flex-col items-start gap-3">
            <BookOpenCheck aria-hidden="true" className="size-8 fill-none text-accent" />
            <p className="m-0 text-fg-muted">لا يوجد برنامج قيد التعلّم حالياً.</p>
            <ButtonLink href={routes.search} variant="soft" size="sm">
              تصفّح البرامج
            </ButtonLink>
          </div>
        ) : (
          <ul className="m-0 flex list-none flex-col p-0">
            {programs.map((program) => (
              <li key={program.id} className="border-t border-line py-4 first:border-t-0 first:pt-0 last:pb-0">
                <ProgramRow program={program} />
              </li>
            ))}
          </ul>
        )}
      </DashboardPanel>

      <div className="grid gap-6 @4xl:grid-cols-2">
        <DashboardPanel id="quick-numbers-title" title="ملخّص سريع" subtitle="من منصة التعلّم">
          {summary.isPending ? (
            <Skeleton className="h-24" />
          ) : summary.isError ? (
            <p className="m-0 text-fg-muted">تعذّر تحميل الملخّص.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <QuickNumber label="اختبارات" value={summary.data?.quizzes ?? 0} />
              <QuickNumber label="شهادات" value={summary.data?.certificates ?? 0} />
              <QuickNumber label="واجبات" value={summary.data?.assignments ?? 0} />
              <QuickNumber label="مراجع محفوظة" value={summary.data?.bookmarks ?? 0} />
            </div>
          )}
        </DashboardPanel>

        <DashboardPanel
          id="recent-results-title"
          title="آخر النتائج"
          subtitle="أحدث درجات الاختبارات"
          action={
            <AppLink href={routes.studentExams} className="ma-btn ma-btn--ghost ma-btn--sm">
              كل الاختبارات
            </AppLink>
          }
        >
          {quizzes.isPending ? (
            <Skeleton className="h-24" />
          ) : quizzes.isError ? (
            <p className="m-0 text-fg-muted">تعذّر تحميل النتائج.</p>
          ) : !quizzes.data?.items.length ? (
            <p className="m-0 text-fg-muted">لا توجد اختبارات مسجّلة بعد.</p>
          ) : (
            <ul className="m-0 flex list-none flex-col p-0">
              {quizzes.data.items.slice(0, 3).map((quiz, index) => (
                <RecentResult key={`${quiz.lms_course_id ?? "quiz"}-${quiz.quiz_title ?? index}`} quiz={quiz} />
              ))}
            </ul>
          )}
        </DashboardPanel>
      </div>
    </div>
  );
}

function ProgramRow({ program }: { program: LearningProgram }) {
  const latin = /[A-Za-z]/.test(program.title);
  // Already sanitized when the program was built (LMS bucket or catalog asset host).
  const image = program.image;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-3">
          {image ? (
            <Image
              src={image}
              alt=""
              width={48}
              height={48}
              sizes="48px"
              className="size-12 shrink-0 rounded-photo object-cover"
            />
          ) : null}
          <div className="min-w-0">
            <h3 dir={latin ? "ltr" : "auto"} className={cn("m-0 truncate leading-6 font-semibold", latin && "text-right")}>
              {program.title}
            </h3>
            <p className="m-0 text-[13px] leading-5 text-fg-muted">
              {program.typeLabel}
              {program.instructor ? (
                <>
                  ، <bdi>{program.instructor}</bdi>
                </>
              ) : null}
              {program.lastActivity ? ` · آخر نشاط ${formatDate(program.lastActivity)}` : null}
            </p>
          </div>
        </div>
        <span
          className={cn(
            "ma-tag shrink-0",
            program.status === "completed"
              ? "ma-tag--green"
              : program.status === "expired"
                ? "ma-tag--pink"
                : "ma-tag--soft",
          )}
        >
          {program.status === "completed"
            ? "مكتمل"
            : program.status === "expired"
              ? "منتهي"
              : program.status === "in_progress"
                ? "قيد التعلّم"
                : "لم يبدأ"}
        </span>
      </div>
      <ProgressTrack
        value={program.progress}
        label="تقدّمك"
        valueLabel={`${formatNumber(program.progress)}%`}
        ariaLabel={`تقدّمك في ${program.title}`}
      />
      <div className="flex flex-wrap items-center justify-end gap-2">
        {program.detailsHref ? (
          <ButtonLink href={program.detailsHref} variant="soft" size="sm">
            عرض التفاصيل
          </ButtonLink>
        ) : program.entitlementId ? (
          <ContinueLearningButton
            entitlementId={program.entitlementId}
            title={program.title}
            variant="soft"
            size="sm"
            block={false}
            label={program.progress > 0 ? "كمّل التعلّم" : "ابدأ التعلّم"}
          />
        ) : (
          <ButtonLink href={routes.studentAccess} variant="soft" size="sm">
            عرض في تعلّمي
          </ButtonLink>
        )}
      </div>
    </div>
  );
}

function RecentResult({ quiz }: { quiz: LmsQuiz }) {
  const image = safeLmsImage(quiz.course_image_url);
  return (
    <li className="flex items-center justify-between gap-3 border-t border-line py-3 first:border-t-0 first:pt-0 last:pb-0">
      <div className="flex min-w-0 items-center gap-3">
        {image ? (
          <Image
            src={image}
            alt=""
            width={36}
            height={36}
            sizes="36px"
            className="size-9 shrink-0 rounded-photo object-cover"
          />
        ) : (
          <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-photo bg-surface-alt">
            <Trophy className="size-4 fill-none text-accent" />
          </span>
        )}
        <div className="min-w-0">
          <p className="m-0 line-clamp-1 text-sm font-semibold">{quiz.quiz_title ?? "اختبار"}</p>
          <p className="m-0 line-clamp-1 text-[13px] text-fg-muted">{quiz.course_title ?? "منصة التعلّم"}</p>
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span dir="ltr" className="text-xl leading-none font-bold tabular-nums">
          {quiz.score_percent === null || quiz.score_percent === undefined
            ? "—"
            : `${formatNumber(quiz.score_percent)}%`}
        </span>
        <span className={cn("ma-tag", quiz.passed ? "ma-tag--green" : "ma-tag--pink")}>
          {quiz.passed ? "ناجح" : "لم ينجح"}
        </span>
      </div>
    </li>
  );
}

function QuickNumber({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-photo bg-surface-alt p-3">
      <span className="text-xl leading-tight font-bold tabular-nums">{formatNumber(value)}</span>
      <span className="text-[13px] text-fg-muted">{label}</span>
    </div>
  );
}
