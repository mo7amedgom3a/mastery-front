"use client";

import { useQuery } from "@tanstack/react-query";
import { ClipboardList, Trophy } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { Button, ButtonLink } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/config/routes";
import { isLmsReauthError, lmsQueries, type LmsQuiz } from "@/lib/api/lms";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/cn";

import { safeLmsImage } from "./model/learning";
import { ContinueLearningButton } from "./components/continue-learning-button";
import { StatGrid } from "./components/stat-grid";

type ExamFilter = "all" | "passed" | "failed";

const FILTERS: { value: ExamFilter; label: string }[] = [
  { value: "all", label: "الكل" },
  { value: "passed", label: "ناجح" },
  { value: "failed", label: "لم ينجح" },
];

/** Live LMS quiz history: recorded results only; the LMS has no upcoming-exam endpoint here. */
export function ExamsPage() {
  const [filter, setFilter] = useState<ExamFilter>("all");
  const quizzes = useQuery(lmsQueries.quizzes());

  const items = quizzes.data?.items ?? [];
  const passed = items.filter((quiz) => quiz.passed === true).length;
  const failed = items.filter((quiz) => quiz.passed === false).length;
  const scored = items.filter((quiz) => quiz.score_percent !== null && quiz.score_percent !== undefined);
  const average =
    scored.length > 0
      ? Math.round(scored.reduce((sum, quiz) => sum + (quiz.score_percent ?? 0), 0) / scored.length)
      : null;
  const visible = items.filter((quiz) =>
    filter === "passed" ? quiz.passed === true : filter === "failed" ? quiz.passed === false : true,
  );
  const reauth = isLmsReauthError(quizzes.error);

  return (
    <div className="@container flex flex-col gap-6">
      {quizzes.isError ? (
        <div className="flex flex-col items-start gap-3 rounded-panel border border-line p-5">
          <p className="m-0 font-bold">
            {reauth ? "انتهت جلسة منصة التعلّم" : "تعذّر تحميل الاختبارات الآن"}
          </p>
          <p className="m-0 text-sm text-fg-muted">
            {reauth
              ? "سجّل الدخول من جديد لتحديث جلسة منصة التعلّم، ثم عد إلى هذه الصفحة."
              : "تحقّق من اتصالك، ثم أعد المحاولة."}
          </p>
          {reauth ? (
            <ButtonLink href={routes.loginThen(routes.studentExams)} variant="primary" size="sm">
              تسجيل الدخول
            </ButtonLink>
          ) : (
            <Button variant="soft" size="sm" onClick={() => void quizzes.refetch()}>
              إعادة المحاولة
            </Button>
          )}
        </div>
      ) : null}

      <StatGrid
        columns={4}
        stats={[
          { label: "اختبارات مسجّلة", value: quizzes.isPending ? "—" : formatNumber(items.length) },
          { label: "نتائج ناجحة", value: quizzes.isPending ? "—" : formatNumber(passed) },
          { label: "نتائج غير ناجحة", value: quizzes.isPending ? "—" : formatNumber(failed) },
          { label: "متوسط الدرجات", value: quizzes.isPending || average === null ? "—" : `${formatNumber(average)}%` },
        ]}
      />

      <div role="group" aria-label="تصفية الاختبارات" className="flex flex-wrap gap-2">
        {FILTERS.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={filter === option.value}
            onClick={() => setFilter(option.value)}
            className={cn(
              "ma-btn ma-btn--sm min-h-11",
              filter === option.value ? "ma-btn--secondary" : "ma-btn--soft",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {quizzes.isPending ? (
        <div role="status" className="grid gap-5 @xl:grid-cols-2">
          <span className="sr-only">جارٍ تحميل اختباراتك…</span>
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      ) : visible.length > 0 ? (
        <ul className="m-0 grid list-none gap-5 p-0 @xl:grid-cols-2">
          {visible.map((quiz, index) => (
            <li key={`${quiz.lms_course_id ?? "quiz"}-${quiz.quiz_title ?? index}`}>
              <QuizCard quiz={quiz} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-start gap-3 rounded-panel border border-dashed border-line p-6">
          <ClipboardList aria-hidden="true" className="size-8 fill-none text-accent" />
          <p className="m-0 font-bold">
            {items.length === 0 ? "لا توجد اختبارات مسجّلة بعد" : "لا توجد نتائج في هذا التصنيف"}
          </p>
          <p className="m-0 text-sm leading-6 text-fg-muted">
            تظهر هنا الاختبارات التي أكملتها في منصة التعلّم، مع درجتك وحالتها.
          </p>
        </div>
      )}
    </div>
  );
}

function QuizCard({ quiz }: { quiz: LmsQuiz }) {
  const image = safeLmsImage(quiz.course_image_url);
  const passed = quiz.passed === true;

  return (
    <article className="flex h-full flex-col gap-4 rounded-panel border border-line bg-surface p-5">
      <div className="flex items-start gap-3">
        {image ? (
          <Image src={image} alt="" width={48} height={48} sizes="48px" className="size-12 shrink-0 rounded-photo object-cover" />
        ) : (
          <span aria-hidden="true" className="grid size-12 shrink-0 place-items-center rounded-photo bg-surface-alt">
            <Trophy className="size-5 fill-none text-accent" />
          </span>
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className={cn("ma-tag w-fit", passed ? "ma-tag--green" : "ma-tag--pink")}>
            {quiz.passed === true ? "ناجح" : quiz.passed === false ? "لم ينجح" : "غير مكتمل"}
          </span>
          <h2 className="m-0 line-clamp-2 text-lg leading-7 font-bold">{quiz.quiz_title ?? "اختبار"}</h2>
          <p className="m-0 line-clamp-1 text-sm text-fg-muted">{quiz.course_title ?? "برنامج من منصة التعلّم"}</p>
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 rounded-photo bg-surface-alt p-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-[13px] text-fg-muted">الدرجة</span>
          <span className="font-semibold tabular-nums">
            {quiz.score === null || quiz.score === undefined || quiz.max_score === null || quiz.max_score === undefined
              ? "—"
              : `${formatNumber(quiz.score)} من ${formatNumber(quiz.max_score)}`}
          </span>
        </div>
        <span dir="ltr" className="text-2xl leading-none font-bold tabular-nums">
          {quiz.score_percent === null || quiz.score_percent === undefined ? "—" : `${formatNumber(quiz.score_percent)}%`}
        </span>
      </div>

      {quiz.entitlement_id ? (
        <ContinueLearningButton
          entitlementId={quiz.entitlement_id}
          title={quiz.course_title ?? quiz.quiz_title ?? "الدورة"}
          variant="soft"
          size="sm"
          block
          label="فتح الدورة"
        />
      ) : null}
    </article>
  );
}
