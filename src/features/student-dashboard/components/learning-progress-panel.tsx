"use client";

import { useQuery } from "@tanstack/react-query";

import { ButtonLink } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardActionLink } from "@/features/student-dashboard/components/dashboard-action-link";
import { routes } from "@/config/routes";
import { isLmsReauthError, LMS_REAUTH_COPY, lmsQueries } from "@/lib/api/lms";
import { formatNumber } from "@/lib/format";

import { averageProgress, lmsProgram, quizStats } from "../model/learning";
import { DashboardPanel } from "./dashboard-panel";
import { ProgressTrack } from "./progress-track";

/** Live LMS summary on the home page: quick counts, course progress and quiz average. */
export function LearningProgressPanel() {
  const summary = useQuery(lmsQueries.summary());
  const courses = useQuery(lmsQueries.courses({ page: 1, page_size: 50 }));
  const quizzes = useQuery(lmsQueries.quizzes());
  const programs = (courses.data?.items ?? []).map(lmsProgram);
  const average = averageProgress(programs);
  const stats = quizStats(quizzes.data?.items ?? []);
  const reauth =
    isLmsReauthError(summary.error) || isLmsReauthError(courses.error) || isLmsReauthError(quizzes.error);
  const failed = summary.isError || courses.isError || quizzes.isError;

  return (
    <DashboardPanel
      id="progress-panel-title"
      title="تقدّم التعلّم"
      subtitle="ملخّص من منصة التعلّم"
      action={
        <DashboardActionLink href={routes.studentProgress}>التفاصيل</DashboardActionLink>
      }
    >
      {courses.isPending ? (
        <div role="status" className="flex flex-col gap-2">
          <span className="sr-only">جارٍ تحميل تقدّمك…</span>
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
        </div>
      ) : failed ? (
        <div className="flex flex-col items-start gap-2">
          <p className="m-0 text-sm text-fg-muted">
            {reauth ? LMS_REAUTH_COPY.short : "تعذّر تحميل تقدّمك الآن."}
          </p>
          {reauth ? (
            <ButtonLink href={routes.studentAccess} variant="soft" size="sm">
              {LMS_REAUTH_COPY.action}
            </ButtonLink>
          ) : null}
        </div>
      ) : programs.length === 0 ? (
        <div className="flex flex-col items-start gap-3">
          <p className="m-0 text-sm text-fg-muted">ابدأ أول برنامج لتتابع تقدّمك وإنجازاتك هنا.</p>
          <ButtonLink href={routes.courses} variant="soft" size="sm">اكتشف الدورات</ButtonLink>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <ProgressTrack
            value={average ?? 0}
            label="متوسط تقدّم البرامج"
            valueLabel={average === null ? "—" : `${formatNumber(average)}%`}
            ariaLabel="متوسط تقدّم برامجك في منصة التعلّم"
          />
          <div className="grid grid-cols-2 gap-3 border-t border-line pt-3">
            <QuickNumber label="اختبارات" value={summary.data?.quizzes ?? stats.total} />
            <QuickNumber label="شهادات" value={summary.data?.certificates ?? 0} />
            <QuickNumber label="واجبات" value={summary.data?.assignments ?? 0} />
            <QuickNumber label="مراجع محفوظة" value={summary.data?.bookmarks ?? 0} />
          </div>
        </div>
      )}
    </DashboardPanel>
  );
}

function QuickNumber({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xl leading-tight font-bold tabular-nums">{formatNumber(value)}</span>
      <span className="text-[13px] text-fg-muted">{label}</span>
    </div>
  );
}
