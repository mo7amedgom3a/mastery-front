"use client";

import { useQuery } from "@tanstack/react-query";
import { Flame } from "lucide-react";
import { Bar, BarChart, Cell, ReferenceLine, XAxis } from "recharts";

import { ChartContainer, ChartTooltip, ChartTooltipContent, kitColor, seriesColor, type ChartConfig } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { ViewAllLink } from "@/components/ui/view-all-link";
import { routes } from "@/config/routes";
import { formatDayLong, formatDuration } from "@/features/student-insights/model/format";
import { insightsQueries } from "@/lib/api/insights";
import { formatNumber } from "@/lib/format";

import { DashboardPanel } from "./dashboard-panel";

const config = { minutes: { label: "وقت التعلّم", color: kitColor("coral") } } satisfies ChartConfig;
const weekday = new Intl.DateTimeFormat("ar", { weekday: "narrow", timeZone: "UTC" });

/** This week at a glance: active minutes per day against the daily goal, streak and top interests. */
export function InsightsSnapshotPanel() {
  // Same cache entry as the insights page's default range.
  const overview = useQuery(insightsQueries.overview("30d"));
  const action = <ViewAllLink href={routes.studentInsights} label="التقرير الكامل" />;

  if (overview.isPending) {
    return (
      <DashboardPanel id="insights-snapshot-title" title="أسبوعك" action={action}>
        <Skeleton className="h-36" />
      </DashboardPanel>
    );
  }
  // The rest of the dashboard stands on its own; a failed insights call just hides this panel.
  if (overview.isError) return null;

  const { activity, interests } = overview.data;
  const week = activity.daily.slice(-7).map((point) => ({
    key: point.date,
    label: weekday.format(new Date(`${point.date}T00:00:00Z`)),
    minutes: point.minutes,
  }));
  const weekTotal = week.reduce((sum, day) => sum + day.minutes, 0);
  const target = activity.daily_target_minutes;
  const streak = activity.current_streak;

  return (
    <DashboardPanel
      id="insights-snapshot-title"
      title="أسبوعك"
      subtitle={weekTotal ? `${formatDuration(weekTotal)} من التعلّم في آخر 7 أيام` : "ابدأ اليوم، وسنحسب وقتك هنا"}
      action={action}
    >
      <ChartContainer config={config} className="aspect-auto h-28 w-full">
        <BarChart data={week} margin={{ top: 4, left: 0, right: 0, bottom: 0 }}>
          <XAxis dataKey="label" reversed tickLine={false} axisLine={false} tickMargin={4} />
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                hideIndicator
                valueSuffix=" دقيقة"
                labelFormatter={(_, payload) => {
                  const key = payload?.[0]?.payload?.key as string | undefined;
                  return key ? formatDayLong(key) : null;
                }}
              />
            }
          />
          {target ? <ReferenceLine y={target} strokeDasharray="3 3" /> : null}
          <Bar dataKey="minutes" radius={[3, 3, 0, 0]} maxBarSize={22} minPointSize={2}>
            {week.map((day) => (
              <Cell
                key={day.key}
                fill={target && day.minutes >= target ? kitColor("green") : day.minutes > 0 ? "var(--color-minutes)" : "var(--line)"}
              />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
      <p className="sr-only">{`مجموع ${formatDuration(weekTotal)} هذا الأسبوع.`}</p>

      <div className="flex items-center gap-3 rounded-photo border border-line p-3">
        <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full bg-yellow text-ink">
          <Flame className="size-5 fill-none" />
        </span>
        <p className="m-0 text-sm leading-6">
          {streak > 0 ? (
            <>
              سلسلتك <b className="tabular-nums">{formatNumber(streak)}</b> {streak === 1 ? "يوم" : "أيام"} متتالية
            </>
          ) : (
            "تعلّم 5 دقائق اليوم لتبدأ سلسلتك"
          )}
          {target ? <span className="block text-xs text-fg-muted">{`هدفك ${formatNumber(target)} دقيقة يومياً`}</span> : null}
        </p>
      </div>

      {interests.length ? (
        <div className="flex flex-col gap-2">
          <h3 className="m-0 text-[13px] font-semibold text-fg-muted">أكثر ما يشدّك</h3>
          <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
            {interests.slice(0, 3).map((interest, index) => (
              <li key={interest.category_id} className="flex items-center gap-1.5 rounded-chip border border-line px-2.5 py-1 text-[13px]">
                <span aria-hidden="true" className="size-2 rounded-full" style={{ background: seriesColor(index) }} />
                {interest.name}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </DashboardPanel>
  );
}
