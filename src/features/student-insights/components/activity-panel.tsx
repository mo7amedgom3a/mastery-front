"use client";

import { Bar, BarChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  kitColor,
  rtlXAxis,
  rtlYAxis,
  type ChartConfig,
} from "@/components/ui/chart";
import { DashboardPanel } from "@/features/student-dashboard/components/dashboard-panel";
import { StatGrid } from "@/features/student-dashboard/components/stat-grid";
import type { InsightsActivity, InsightsRange } from "@/lib/api/insights";
import { formatNumber } from "@/lib/format";

import { activitySeries, formatDayLong, formatDuration } from "../model/format";
import { ChartSummary, PanelEmpty } from "./panel-states";

const config = { minutes: { label: "وقت التعلّم", color: kitColor("coral") } } satisfies ChartConfig;

const BUCKET_LABEL: Record<InsightsRange, string> = { "30d": "يومياً", "90d": "أسبوعياً", "365d": "شهرياً" };

function days(count: number): string {
  return count === 1 ? "يوم واحد" : count === 2 ? "يومان" : `${formatNumber(count)} أيام`;
}

/** Active time over the range, with the onboarding daily target as a reference line. */
export function ActivityPanel({ activity, range }: { activity: InsightsActivity; range: InsightsRange }) {
  const series = activitySeries(activity, range);
  const target = activity.daily_target_minutes;
  const daily = range === "30d";

  return (
    <DashboardPanel
      id="insights-activity-title"
      title="وقتك النشط"
      subtitle={`الدقائق التي قضيتها فعلياً على المنصّة، ${BUCKET_LABEL[range]}`}
    >
      <StatGrid
        columns={4}
        stats={[
          { label: "إجمالي الوقت", value: formatDuration(activity.total_minutes) },
          { label: "أيام النشاط", value: formatNumber(activity.active_days) },
          { label: "سلسلتك الحالية", value: days(activity.current_streak), hint: "أيام متتالية" },
          { label: "أطول سلسلة", value: days(activity.longest_streak) },
        ]}
      />

      {activity.total_minutes === 0 ? (
        <PanelEmpty>
          سنبدأ بقياس وقتك من اليوم. ادخل إلى برامجك وتعلّم بضع دقائق، وسيظهر هنا نشاطك يوماً بيوم.
        </PanelEmpty>
      ) : (
        <>
          <ChartContainer config={config} className="aspect-auto h-56 w-full md:h-64">
            <BarChart data={series} margin={{ top: 8, left: 4, right: 4 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="label" {...rtlXAxis} interval="preserveStartEnd" minTickGap={16} />
              <YAxis {...rtlYAxis} allowDecimals={false} />
              <ChartTooltip
                cursor
                content={
                  <ChartTooltipContent
                    valueSuffix=" دقيقة"
                    labelFormatter={(_, payload) => {
                      const key = payload?.[0]?.payload?.key as string | undefined;
                      return key ? (daily ? formatDayLong(key) : `من ${formatDayLong(key)}`) : null;
                    }}
                  />
                }
              />
              {daily && target ? (
                <ReferenceLine
                  y={target}
                  strokeDasharray="4 4"
                  label={{ value: `هدفك ${formatNumber(target)} د`, position: "insideTopLeft", className: "fill-fg text-[11px]" }}
                />
              ) : null}
              <Bar dataKey="minutes" fill="var(--color-minutes)" radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ChartContainer>
          <ChartSummary>
            {`مجموع ${formatDuration(activity.total_minutes)} خلال ${formatNumber(activity.active_days)} يوم نشاط.`}
          </ChartSummary>
          <p className="m-0 text-sm leading-6 text-fg-muted">
            {`متوسطك ${formatDuration(activity.avg_minutes_per_active_day)} في يوم النشاط`}
            {target ? ` · حقّقت هدفك اليومي في ${days(activity.target_days_met)}` : ""}.
          </p>
        </>
      )}
    </DashboardPanel>
  );
}
