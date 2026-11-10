"use client";

import { useQuery } from "@tanstack/react-query";
import { Trophy } from "lucide-react";
import Image from "next/image";

import { AppLink } from "@/components/ui/app-link";
import { ButtonLink } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/config/routes";
import { lmsQueries, isLmsReauthError, type LmsQuiz } from "@/lib/api/lms";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/cn";

import { safeLmsImage } from "../model/learning";
import { DashboardPanel } from "./dashboard-panel";

/** Live LMS quiz summary: the latest recorded result and the total count. */
export function ExamsPanel() {
  const quizzes = useQuery(lmsQueries.quizzes());
  const summary = useQuery(lmsQueries.summary());
  const latest = quizzes.data?.items[0] ?? null;
  const total = summary.data?.quizzes ?? quizzes.data?.items.length ?? 0;
  const reauth = isLmsReauthError(quizzes.error) || isLmsReauthError(summary.error);

  return (
    <DashboardPanel
      id="exams-panel-title"
      title="اختباراتك"
      subtitle={`${formatNumber(total)} اختبارات مسجّلة`}
      action={
        <AppLink href={routes.studentExams} className="ma-btn ma-btn--ghost ma-btn--sm">
          كل الاختبارات
        </AppLink>
      }
    >
      {quizzes.isPending ? (
        <div role="status" className="flex flex-col gap-2">
          <span className="sr-only">جارٍ تحميل اختباراتك…</span>
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      ) : quizzes.isError ? (
        <div className="flex flex-col items-start gap-2">
          <p className="m-0 text-sm text-fg-muted">
            {reauth ? "انتهت جلسة منصة التعلّم. سجّل الدخول من جديد لعرض نتائجك." : "تعذّر تحميل الاختبارات الآن."}
          </p>
          {reauth ? (
            <ButtonLink href={routes.loginThen(routes.studentHome)} variant="soft" size="sm">
              تسجيل الدخول
            </ButtonLink>
          ) : null}
        </div>
      ) : !latest ? (
        <p className="m-0 text-sm text-fg-muted">لا توجد اختبارات مسجّلة بعد.</p>
      ) : (
        <LatestResult quiz={latest} />
      )}
    </DashboardPanel>
  );
}

function LatestResult({ quiz }: { quiz: LmsQuiz }) {
  const image = safeLmsImage(quiz.course_image_url);
  return (
    <div className="flex items-start gap-3">
      {image ? (
        <Image
          src={image}
          alt=""
          width={48}
          height={48}
          sizes="48px"
          className="size-12 shrink-0 rounded-photo object-cover"
        />
      ) : (
        <span aria-hidden="true" className="grid size-12 shrink-0 place-items-center rounded-photo bg-surface-alt">
          <Trophy className="size-5 fill-none text-accent" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="m-0 line-clamp-2 text-sm leading-6 font-semibold">{quiz.quiz_title ?? "اختبار"}</p>
        <p className="m-0 text-[13px] text-fg-muted">{quiz.course_title ?? "برنامج من منصة التعلّم"}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className={cn("ma-tag", quiz.passed ? "ma-tag--green" : "ma-tag--pink")}>
            {quiz.passed ? "ناجح" : "لم تنجح"}
          </span>
          {quiz.score_percent !== null && quiz.score_percent !== undefined ? (
            <span dir="ltr" className="text-lg leading-none font-bold tabular-nums">
              {formatNumber(quiz.score_percent)}%
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
