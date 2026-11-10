"use client";

import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart } from "recharts";

import { ButtonLink } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent, kitColor, type ChartConfig } from "@/components/ui/chart";
import { routes } from "@/config/routes";
import { DashboardPanel } from "@/features/student-dashboard/components/dashboard-panel";
import { ProgressTrack } from "@/features/student-dashboard/components/progress-track";
import type { InsightsSkill } from "@/lib/api/insights";
import { formatNumber } from "@/lib/format";

import { formatPercent } from "../model/format";
import { ChartSummary, PanelEmpty } from "./panel-states";

const config = { coverage: { label: "التغطية", color: kitColor("purple") } } satisfies ChartConfig;
/** A radar needs at least three axes to read as a shape. */
const RADAR_MIN = 3;
const MAX_SKILLS = 8;

function shortName(name: string): string {
  return name.length > 18 ? `${name.slice(0, 17)}…` : name;
}

/** How far the student's programs take them on each target skill from onboarding. */
export function SkillsPanel({ skills }: { skills: InsightsSkill[] }) {
  const rows = skills.slice(0, MAX_SKILLS).map((skill) => ({
    name: shortName(skill.name),
    fullName: skill.name,
    coverage: Math.round(skill.coverage),
    products: skill.products,
  }));

  return (
    <DashboardPanel
      id="insights-skills-title"
      title="خريطة مهاراتك"
      subtitle="مدى تقدّمك في المهارات التي اخترتها، عبر البرامج التي تغطيها"
    >
      {rows.length === 0 ? (
        <PanelEmpty
          action={
            <ButtonLink href={routes.studentProfile} variant="ghost" size="sm">
              اختر مهاراتك
            </ButtonLink>
          }
        >
          لم تحدّد مهارات تستهدفها بعد.
        </PanelEmpty>
      ) : rows.length >= RADAR_MIN ? (
        <>
          <ChartContainer config={config} className="mx-auto aspect-square w-full max-w-sm">
            <RadarChart data={rows} outerRadius="70%">
              <ChartTooltip
                content={<ChartTooltipContent valueSuffix="٪" labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName} />}
              />
              <PolarGrid />
              <PolarAngleAxis dataKey="name" tick={{ fontSize: 11 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
              <Radar dataKey="coverage" fill="var(--color-coverage)" fillOpacity={0.35} stroke="var(--color-coverage)" strokeWidth={2} />
            </RadarChart>
          </ChartContainer>
          <ChartSummary>{rows.map((row) => `${row.fullName}: ${formatNumber(row.coverage)}٪`).join("؛ ")}</ChartSummary>
        </>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {rows.map((row) => (
            <li key={row.fullName}>
              <ProgressTrack value={row.coverage} label={row.fullName} valueLabel={formatPercent(row.coverage)} />
            </li>
          ))}
        </ul>
      )}
      {rows.some((row) => row.products === 0) ? (
        <p className="m-0 text-[13px] text-fg-muted">
          {`مهارات بلا برامج بعد: ${rows
            .filter((row) => row.products === 0)
            .map((row) => row.fullName)
            .join("، ")}.`}
        </p>
      ) : null}
    </DashboardPanel>
  );
}
