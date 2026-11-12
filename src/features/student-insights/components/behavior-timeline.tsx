"use client";

import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from "recharts";

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
import { formatNumber } from "@/lib/format";

import { READY_BENCHMARK, type LabInsights } from "../model/lab-insights";
import { ChartSummary, PanelEmpty } from "./panel-states";

const config = {
  score: { label: "النتيجة الكلية", color: kitColor("coral") },
  weakest: { label: "أضعف محور في الجلسة", color: kitColor("sky") },
} satisfies ChartConfig;

/** Results across attempts, with the weakest axis of each attempt — the line that reveals behavioural habits. */
export function BehaviorTimeline({ insight }: { insight: LabInsights }) {
  const series = insight.timeline;

  return (
    <DashboardPanel
      id="insights-behavior-timeline-title"
      title="تطوّرك عبر المحاولات"
      subtitle="كل نقطة محاولة أكملتها، ونتيجتها الكلية بجانب أضعف محور فيها."
    >
      {!series.length ? (
        <PanelEmpty>لا محاولات في هذه الفترة. أكمل مختبرًا ليبدأ الخط.</PanelEmpty>
      ) : (
        <>
          <ChartContainer config={config} className="aspect-auto h-56 w-full md:h-64">
            <LineChart data={series} margin={{ top: 8, left: 4, right: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="label" {...rtlXAxis} interval="preserveStartEnd" minTickGap={18} />
              <YAxis {...rtlYAxis} domain={[0, 100]} allowDecimals={false} />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    valueSuffix="٪"
                    labelFormatter={(_, payload) => {
                      const entry = payload?.[0]?.payload as { labTitle?: string; label?: string } | undefined;
                      return entry ? `${entry.labTitle} · ${entry.label}` : null;
                    }}
                  />
                }
              />
              <ReferenceLine y={READY_BENCHMARK} strokeDasharray="4 4" />
              <Line type="monotone" dataKey="score" stroke="var(--color-score)" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              <Line
                type="monotone"
                dataKey="weakest"
                stroke="var(--color-weakest)"
                strokeWidth={2}
                strokeDasharray="5 4"
                dot={{ r: 2.5 }}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ChartContainer>
          <ChartSummary>
            {series.map((point) => `${point.labTitle} في ${point.label}: ${formatNumber(point.score)}، وأضعف محور ${point.weakestLabel} ${formatNumber(point.weakest)}`).join("؛ ")}
          </ChartSummary>
          <ul className="m-0 flex list-none flex-wrap gap-3 p-0 text-xs text-fg-muted" aria-label="مفتاح الخط">
            <li className="inline-flex items-center gap-1.5">
              <span className="h-0.5 w-4 rounded-full" style={{ backgroundColor: kitColor("coral") }} aria-hidden /> النتيجة الكلية
            </li>
            <li className="inline-flex items-center gap-1.5">
              <span className="h-0.5 w-4 rounded-full" style={{ backgroundColor: kitColor("sky") }} aria-hidden /> أضعف محور
            </li>
            <li className="inline-flex items-center gap-1.5">
              <span className="h-0.5 w-4 border-t border-dashed border-fg-muted" aria-hidden /> الجاهزية {formatNumber(READY_BENCHMARK)}٪
            </li>
          </ul>
        </>
      )}
    </DashboardPanel>
  );
}
