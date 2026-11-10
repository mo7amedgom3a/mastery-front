"use client";

import { Cell, Pie, PieChart } from "recharts";

import { ButtonLink } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent, kitColor, type ChartConfig } from "@/components/ui/chart";
import { routes } from "@/config/routes";
import { DashboardPanel } from "@/features/student-dashboard/components/dashboard-panel";
import { ProgressTrack } from "@/features/student-dashboard/components/progress-track";
import type { InsightsLearning } from "@/lib/api/insights";
import { formatNumber } from "@/lib/format";

import { STATUS_LABELS, formatDuration, formatPercent } from "../model/format";
import { ChartSummary, PanelEmpty } from "./panel-states";

const config = {
  completed: { label: STATUS_LABELS.completed, color: kitColor("green") },
  in_progress: { label: STATUS_LABELS.in_progress, color: kitColor("yellow") },
  not_started: { label: STATUS_LABELS.not_started, color: "var(--line)" },
} satisfies ChartConfig;

/** Where each owned program stands: a status donut plus the most recently touched programs. */
export function CoursesPanel({ learning }: { learning: InsightsLearning }) {
  const slices = (["completed", "in_progress", "not_started"] as const)
    .map((status) => ({ status, value: learning[status], fill: `var(--color-${status})` }))
    .filter((slice) => slice.value > 0);

  return (
    <DashboardPanel
      id="insights-courses-title"
      title="برامجك"
      subtitle="حالة كل برنامج تملكه ونسبة إنجازه"
      action={
        <ButtonLink href={routes.studentProgress} variant="ghost" size="sm">
          التفاصيل
        </ButtonLink>
      }
    >
      {learning.total === 0 ? (
        <PanelEmpty
          action={
            <ButtonLink href={routes.search} variant="primary" size="sm">
              تصفّح البرامج
            </ButtonLink>
          }
        >
          لا برامج بعد. اختر أول برنامج لتبدأ قياس تقدّمك.
        </PanelEmpty>
      ) : (
        <div className="grid gap-5 @2xl:grid-cols-[minmax(0,13rem)_1fr]">
          <div className="flex flex-col items-center gap-3">
            <div className="relative w-full max-w-52">
              <ChartContainer config={config} className="aspect-square w-full">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent nameKey="status" hideLabel />} />
                  <Pie data={slices} dataKey="value" nameKey="status" innerRadius="62%" strokeWidth={2} isAnimationActive={false}>
                    {slices.map((slice) => (
                      <Cell key={slice.status} fill={slice.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
              <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
                <div>
                  <div className="text-2xl font-bold tabular-nums">{formatPercent(learning.average_progress)}</div>
                  <div className="text-xs text-fg-muted">متوسط الإنجاز</div>
                </div>
              </div>
            </div>
            <ul className="m-0 flex list-none flex-wrap justify-center gap-x-4 gap-y-1 p-0 text-[13px]">
              {(["completed", "in_progress", "not_started"] as const).map((status) => (
                <li key={status} className="flex items-center gap-1.5">
                  <span aria-hidden="true" className="size-2.5" style={{ background: config[status].color }} />
                  {STATUS_LABELS[status]} <b className="tabular-nums">{formatNumber(learning[status])}</b>
                </li>
              ))}
            </ul>
            <ChartSummary>
              {`${formatNumber(learning.completed)} مكتملة، ${formatNumber(learning.in_progress)} قيد التعلّم، ${formatNumber(learning.not_started)} لم تبدأ.`}
            </ChartSummary>
          </div>

          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {learning.products.slice(0, 6).map((product) => (
              <li key={product.product_id}>
                <ProgressTrack
                  value={product.progress_pct ?? 0}
                  label={<span className="line-clamp-1 text-fg">{product.title}</span>}
                  ariaLabel={product.title}
                  valueLabel={
                    product.minutes
                      ? `${formatPercent(product.progress_pct ?? 0)} · ${formatDuration(product.minutes)}`
                      : formatPercent(product.progress_pct ?? 0)
                  }
                />
              </li>
            ))}
          </ul>
        </div>
      )}
      {learning.certificates ? (
        <p className="m-0 text-sm text-fg-muted">
          {`حصلت على ${formatNumber(learning.certificates)} شهادة`}
          {learning.cpd_hours ? ` و${formatNumber(learning.cpd_hours)} ساعة CPD` : ""}.
        </p>
      ) : null}
    </DashboardPanel>
  );
}
