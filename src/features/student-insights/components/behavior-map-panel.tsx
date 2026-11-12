"use client";

import { Cell, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ReferenceLine, Scatter, ScatterChart, XAxis, YAxis, ZAxis } from "recharts";

import type { BrandColor } from "@/components/ui/brand-colors";
import { ChartContainer, ChartTooltip, ChartTooltipContent, kitColor, type ChartConfig } from "@/components/ui/chart";
import { DashboardPanel } from "@/features/student-dashboard/components/dashboard-panel";
import { formatNumber } from "@/lib/format";

import { READY_BENCHMARK, type CompassPoint, type LabInsights } from "../model/lab-insights";
import { formatPercent } from "../model/format";
import { ChartSummary, PanelEmpty } from "./panel-states";

const radarConfig = {
  level: { label: "مستواك", color: kitColor("coral") },
  benchmark: { label: "الجاهزية", color: kitColor("sky") },
} satisfies ChartConfig;

type CompassPayload = { active?: boolean; payload?: readonly { payload?: CompassPoint }[] };

function CompassTooltip({ active, payload }: CompassPayload) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;
  return (
    <div className="grid min-w-40 gap-1 rounded-ctl border border-line-strong bg-surface px-3 py-2 text-xs text-fg">
      <span className="font-bold">{point.title}</span>
      <span className="flex justify-between gap-3">
        <span className="text-fg-muted">النتيجة</span>
        <span className="font-bold tabular-nums">{formatNumber(point.score)}</span>
      </span>
      <span className="flex justify-between gap-3">
        <span className="text-fg-muted">تواصل وتعاطف</span>
        <span className="font-bold tabular-nums">{formatNumber(point.x)}</span>
      </span>
      <span className="flex justify-between gap-3">
        <span className="text-fg-muted">قرار وإقناع</span>
        <span className="font-bold tabular-nums">{formatNumber(point.y)}</span>
      </span>
      <span className="mt-1 rounded-chip bg-surface-alt px-2 py-0.5 text-center font-semibold">{point.quadrant}</span>
    </div>
  );
}

/** Two readings of the same practice: skill levels against readiness, and where each lab lands on the behaviour compass. */
export function BehaviorMapPanel({ insight }: { insight: LabInsights }) {
  const rows = insight.skills
    .filter((skill) => skill.level != null)
    .map((skill) => ({ name: skill.shortLabel, fullName: skill.label, level: skill.level ?? 0, benchmark: READY_BENCHMARK }));
  const points = insight.compass;

  return (
    <DashboardPanel
      id="insights-behavior-map-title"
      title="خريطة سلوكك في المختبرات"
      subtitle="محاور المهارة مقابل مستوى الجاهزية، وموقع كل مختبر بين التواصل والحسم."
    >
      {rows.length < 3 || !points.length ? (
        <PanelEmpty>أكمل مختبرين على الأقل لتتضح الخريطة. المحور الواحد لا يشكّل صورة.</PanelEmpty>
      ) : (
        <div className="grid gap-6 @3xl:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-3">
            <h3 className="m-0 text-sm font-bold">مستواك مقابل الجاهزية ({READY_BENCHMARK}٪)</h3>
            <ChartContainer config={radarConfig} className="mx-auto aspect-square w-full max-w-sm">
              <RadarChart data={rows} outerRadius="64%">
                <ChartTooltip
                  content={<ChartTooltipContent labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName} />}
                />
                <PolarGrid />
                <PolarAngleAxis dataKey="name" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                <Radar dataKey="benchmark" fill="var(--color-benchmark)" fillOpacity={0.08} stroke="var(--color-benchmark)" strokeDasharray="4 4" strokeWidth={1.5} />
                <Radar dataKey="level" fill="var(--color-level)" fillOpacity={0.35} stroke="var(--color-level)" strokeWidth={2} />
              </RadarChart>
            </ChartContainer>
            <ChartSummary>
              {insight.skills
                .filter((skill) => skill.level != null)
                .map((skill) => `${skill.label} ${formatPercent(skill.level)}`)
                .join("، ")}
              ، مقابل جاهزية عند {formatPercent(READY_BENCHMARK)}.
            </ChartSummary>
            <ul className="m-0 flex list-none flex-wrap gap-3 p-0 text-xs text-fg-muted" aria-label="مفتاح الخريطة">
              <li className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-full" style={{ backgroundColor: kitColor("coral") }} aria-hidden /> مستواك
              </li>
              <li className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-full" style={{ backgroundColor: kitColor("sky") }} aria-hidden /> الجاهزية
              </li>
            </ul>
          </div>

          <div className="flex min-w-0 flex-col gap-3">
            <h3 className="m-0 text-sm font-bold">بوصلة السلوك</h3>
            <ChartContainer config={{}} className="aspect-auto h-64 w-full">
              <ScatterChart margin={{ top: 12, right: 12, bottom: 8, left: 0 }}>
                <XAxis
                  type="number"
                  dataKey="x"
                  domain={[0, 100]}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  name="تواصل وتعاطف"
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  domain={[0, 100]}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={4}
                  width={32}
                  tick={{ fontSize: 11 }}
                />
                <ZAxis type="number" dataKey="score" range={[70, 300]} />
                <ReferenceLine x={50} strokeDasharray="4 4" />
                <ReferenceLine y={50} strokeDasharray="4 4" />
                <ChartTooltip content={<CompassTooltip />} />
                <Scatter data={points} isAnimationActive={false}>
                  {points.map((point) => (
                    <Cell key={point.slug} fill={kitColor(point.color as BrandColor)} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ChartContainer>
            <ChartSummary>
              {points.map((point) => `${point.title}: تواصل ${formatNumber(point.x)}، حسم ${formatNumber(point.y)}، ${point.quadrant}`).join("؛ ")}
            </ChartSummary>
            <p className="m-0 text-xs leading-5 text-fg-muted">
              المحور الأفقي: التواصل والتعاطف · الرأسي: القرار والإقناع · حجم الدائرة: النتيجة الكلية. الربع الأعلى يميناً هو
              «قيادة متوازنة»، والأعلى يساراً «حسم سريع»، والأسفل يميناً «تواصل بلا قرار»، والأسفل يساراً «مساحة للتطوير». المختبر الذي لا يقيس أحد المحورين لا يظهر هنا.
            </p>
          </div>
        </div>
      )}
    </DashboardPanel>
  );
}
