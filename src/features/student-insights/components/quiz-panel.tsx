"use client";

import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, XAxis, YAxis } from "recharts";

import { ButtonLink } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  kitColor,
  rtlXAxis,
  rtlYAxis,
  type ChartConfig,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/config/routes";
import { DashboardPanel } from "@/features/student-dashboard/components/dashboard-panel";
import { isLmsReauthError, lmsQueries } from "@/lib/api/lms";
import { formatNumber } from "@/lib/format";

import { ChartSummary, PanelEmpty } from "./panel-states";

const config = { score: { label: "الدرجة" } } satisfies ChartConfig;
const MAX_QUIZZES = 10;

function percent(score?: number | null, max?: number | null, given?: number | null): number | null {
  if (given != null) return Math.round(given);
  if (score == null || !max) return null;
  return Math.round((score / max) * 100);
}

/** Recent quiz scores from the LMS (live, so it loads on its own and may ask to sign in again). */
export function QuizPanel() {
  const quizzes = useQuery(lmsQueries.quizzes());
  const rows = (quizzes.data?.items ?? [])
    .map((quiz, index) => ({
      key: `${quiz.lms_course_id ?? "x"}-${index}`,
      label: quiz.quiz_title ?? quiz.course_title ?? `اختبار ${index + 1}`,
      course: quiz.course_title,
      score: percent(quiz.score, quiz.max_score, quiz.score_percent),
      passed: quiz.passed,
    }))
    .filter((row): row is typeof row & { score: number } => row.score != null)
    .slice(0, MAX_QUIZZES);
  const average = rows.length ? Math.round(rows.reduce((sum, row) => sum + row.score, 0) / rows.length) : null;

  return (
    <DashboardPanel
      id="insights-quiz-title"
      title="نتائج اختباراتك"
      subtitle={average == null ? "درجاتك في آخر الاختبارات" : `متوسط درجاتك ${formatNumber(average)}٪`}
      action={
        <ButtonLink href={routes.studentExams} variant="ghost" size="sm">
          كل الاختبارات
        </ButtonLink>
      }
    >
      {quizzes.isPending ? (
        <Skeleton className="h-48" />
      ) : quizzes.isError ? (
        <PanelEmpty>
          {isLmsReauthError(quizzes.error)
            ? "سجّل الدخول مرة أخرى لعرض نتائج اختباراتك."
            : "تعذّر تحميل نتائج الاختبارات الآن."}
        </PanelEmpty>
      ) : rows.length === 0 ? (
        <PanelEmpty>لم تؤدِّ اختبارات بعد. ستظهر درجاتك هنا بعد أول اختبار.</PanelEmpty>
      ) : (
        <>
          <ChartContainer config={config} className="aspect-auto h-56 w-full">
            <BarChart data={rows} margin={{ top: 8, left: 4, right: 4 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="label" {...rtlXAxis} tick={false} height={4} />
              <YAxis {...rtlYAxis} domain={[0, 100]} tickFormatter={(v: number) => `${formatNumber(v)}٪`} />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    hideIndicator
                    valueSuffix="٪"
                    labelFormatter={(_, payload) => {
                      const row = payload?.[0]?.payload as (typeof rows)[number] | undefined;
                      return row ? `${row.label}${row.course && row.course !== row.label ? ` · ${row.course}` : ""}` : null;
                    }}
                  />
                }
              />
              <ReferenceLine y={average ?? 0} strokeDasharray="4 4" />
              <Bar dataKey="score" radius={[4, 4, 0, 0]} maxBarSize={28}>
                {rows.map((row) => (
                  <Cell key={row.key} fill={row.passed === false ? kitColor("pink") : kitColor("teal")} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
          <ChartSummary>{rows.map((row) => `${row.label}: ${formatNumber(row.score)}٪`).join("؛ ")}</ChartSummary>
          <p className="m-0 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-fg-muted">
            <span className="flex items-center gap-1.5">
              <span aria-hidden="true" className="size-2.5 bg-teal" /> ناجح
            </span>
            <span className="flex items-center gap-1.5">
              <span aria-hidden="true" className="size-2.5 bg-pink" /> يحتاج إعادة
            </span>
            <span>الخط المتقطّع: متوسطك</span>
          </p>
        </>
      )}
    </DashboardPanel>
  );
}
