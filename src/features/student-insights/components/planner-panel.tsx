"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { ButtonLink } from "@/components/ui/button";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  kitColor,
  rtlXAxis,
  rtlYAxis,
  type ChartConfig,
} from "@/components/ui/chart";
import { routes } from "@/config/routes";
import { DashboardPanel } from "@/features/student-dashboard/components/dashboard-panel";
import type { InsightsPlannerWeek } from "@/lib/api/insights";
import { formatNumber } from "@/lib/format";

import { formatDayLong, formatDayShort, formatDuration } from "../model/format";
import { ChartSummary, PanelEmpty } from "./panel-states";

const config = {
  planned: { label: "مخطّط", color: kitColor("sky") },
  done: { label: "منجز", color: kitColor("green") },
} satisfies ChartConfig;
const MAX_WEEKS = 12;

/** Planned study time against what was ticked off, week by week (weeks start on Saturday). */
export function PlannerPanel({ weeks }: { weeks: InsightsPlannerWeek[] }) {
  const recent = weeks.slice(-MAX_WEEKS);
  const rows = recent.map((week) => ({
    key: week.week_start,
    label: formatDayShort(week.week_start),
    planned: week.planned_minutes,
    done: week.done_minutes,
  }));
  const planned = rows.reduce((sum, row) => sum + row.planned, 0);
  const done = rows.reduce((sum, row) => sum + row.done, 0);
  const rate = planned ? Math.round((done / planned) * 100) : null;

  return (
    <DashboardPanel
      id="insights-planner-title"
      title="التزامك بخطتك"
      subtitle={rate == null ? "وقت المذاكرة المخطّط مقابل المنجز أسبوعياً" : `أنجزت ${formatNumber(rate)}٪ مما خطّطت له`}
      action={
        <ButtonLink href={routes.studentPlanner()} variant="ghost" size="sm">
          افتح الخطة
        </ButtonLink>
      }
    >
      {planned === 0 ? (
        <PanelEmpty
          action={
            <ButtonLink href={routes.studentPlanner()} variant="primary" size="sm">
              خطّط لأسبوعك
            </ButtonLink>
          }
        >
          أضف أوقات مذاكرة إلى خطتك، وسنقارن هنا بين ما خطّطت له وما أنجزته.
        </PanelEmpty>
      ) : (
        <>
          <ChartContainer config={config} className="aspect-auto h-56 w-full">
            <BarChart data={rows} margin={{ top: 8, left: 4, right: 4 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="label" {...rtlXAxis} minTickGap={12} />
              <YAxis {...rtlYAxis} allowDecimals={false} />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    valueSuffix=" دقيقة"
                    labelFormatter={(_, payload) => {
                      const key = payload?.[0]?.payload?.key as string | undefined;
                      return key ? `أسبوع ${formatDayLong(key)}` : null;
                    }}
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="planned" fill="var(--color-planned)" radius={[4, 4, 0, 0]} maxBarSize={18} />
              <Bar dataKey="done" fill="var(--color-done)" radius={[4, 4, 0, 0]} maxBarSize={18} />
            </BarChart>
          </ChartContainer>
          <ChartSummary>{`خطّطت ${formatDuration(planned)} وأنجزت ${formatDuration(done)}.`}</ChartSummary>
        </>
      )}
    </DashboardPanel>
  );
}
