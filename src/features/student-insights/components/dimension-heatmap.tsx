"use client";

import { AppLink } from "@/components/ui/app-link";
import { DashboardPanel } from "@/features/student-dashboard/components/dashboard-panel";
import { routes } from "@/config/routes";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";

import { SKILLS, type HeatmapRow, type LabInsights } from "../model/lab-insights";
import { skillShortLabels, type Skill } from "@/features/labs/model/types";
import { PanelEmpty } from "./panel-states";

function cellClass(score: number | null): string {
  if (score == null) return "bg-surface-alt text-fg-muted";
  if (score >= 80) return "bg-green text-ink";
  if (score >= 70) return "bg-green/60 text-ink";
  if (score >= 55) return "bg-yellow/70 text-ink";
  if (score >= 40) return "bg-pink/45 text-ink";
  return "bg-pink/75 text-ink";
}

function HeatmapTable({ rows }: { rows: HeatmapRow[] }) {
  return (
    <div className="w-full min-w-0 overflow-x-auto [contain:paint]">
      <table className="w-full min-w-[40rem] border-separate border-spacing-1 text-center text-[13px]">
        <caption className="sr-only">
          مستوى كل مهارة في أفضل محاولة لكل مختبر. الخلايا الفارغة تعني أن المختبر لم يقيّم تلك المهارة.
        </caption>
        <thead>
          <tr>
            <th scope="col" className="sticky start-0 bg-surface px-2 text-start text-[13px] font-semibold text-fg-muted">
              المختبر
            </th>
            {SKILLS.map((skill) => (
              <th key={skill} scope="col" className="px-1 pb-1 text-[12px] font-semibold text-fg-muted">
                {skillShortLabels[skill]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.slug}>
              <th scope="row" className="sticky start-0 max-w-52 bg-surface px-2 py-1.5 text-start font-semibold">
                <AppLink href={routes.lab(row.slug)} className="hover:text-accent">
                  {row.title}
                </AppLink>
              </th>
              {SKILLS.map((skill: Skill) => {
                const score = row.scores[skill];
                return (
                  <td
                    key={skill}
                    className={cn("rounded-[6px] px-1 py-2 font-semibold tabular-nums", cellClass(score))}
                    aria-label={`${skillShortLabels[skill]}: ${score == null ? "لم يُقس" : `${score} بالمئة`}`}
                  >
                    {score == null ? "—" : formatNumber(score)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Lab × skill grid: which scenario proves which skill, and where the holes are. */
export function DimensionHeatmap({ insight }: { insight: LabInsights }) {
  const rows = [...insight.heatmap].sort((a, b) => b.overall - a.overall);

  return (
    <DashboardPanel
      id="insights-heatmap-title"
      title="أين تظهر كل مهارة؟"
      subtitle="أفضل محاولة لكل مختبر، موزّعة على محاور المهارة السبعة."
    >
      {!rows.length ? (
        <PanelEmpty>أكمل مختبرًا لتظهر المصفوفة: أي سيناريو يقيس أي مهارة.</PanelEmpty>
      ) : (
        <>
          <HeatmapTable rows={rows} />
          <ul className="m-0 flex list-none flex-wrap gap-3 p-0 text-xs text-fg-muted" aria-label="مفتاح الألوان">
            <li className="inline-flex items-center gap-1.5">
              <span className="size-3 rounded-[4px] bg-green" aria-hidden /> 80+
            </li>
            <li className="inline-flex items-center gap-1.5">
              <span className="size-3 rounded-[4px] bg-green/60" aria-hidden /> 70–79
            </li>
            <li className="inline-flex items-center gap-1.5">
              <span className="size-3 rounded-[4px] bg-yellow/70" aria-hidden /> 55–69
            </li>
            <li className="inline-flex items-center gap-1.5">
              <span className="size-3 rounded-[4px] bg-pink/45" aria-hidden /> 40–54
            </li>
            <li className="inline-flex items-center gap-1.5">
              <span className="size-3 rounded-[4px] bg-pink/75" aria-hidden /> أقل من 40
            </li>
            <li className="inline-flex items-center gap-1.5">
              <span className="size-3 rounded-[4px] bg-surface-alt border border-line" aria-hidden /> لم يُقس
            </li>
          </ul>
        </>
      )}
    </DashboardPanel>
  );
}
