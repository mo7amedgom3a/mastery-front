"use client";

import { ArrowDownLeft, ArrowUpRight, Minus, ShieldCheck, Sparkles, Target } from "lucide-react";

import { ViewAllLink } from "@/components/ui/view-all-link";
import { routes } from "@/config/routes";
import { DashboardPanel } from "@/features/student-dashboard/components/dashboard-panel";
import { StatGrid } from "@/features/student-dashboard/components/stat-grid";
import { labs } from "@/features/labs/model/catalog";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";

import { formatDuration, formatPercent } from "../model/format";
import type { LabInsights, SkillStat } from "../model/lab-insights";

function Trend({ stat }: { stat: SkillStat }) {
  if (stat.delta == null || stat.delta === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs text-fg-muted">
        <Minus className="size-3.5" aria-hidden /> ثابت
      </span>
    );
  }
  const up = stat.delta > 0;
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-xs font-semibold", up ? "text-green" : "text-pink")}>
      {up ? <ArrowUpRight className="size-3.5" aria-hidden /> : <ArrowDownLeft className="size-3.5" aria-hidden />}
      {up ? "+" : "−"}
      {formatNumber(Math.abs(stat.delta))}
    </span>
  );
}

function SkillTile({ stat, tone }: { stat: SkillStat; tone: "weak" | "strong" }) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-1 rounded-photo border p-4",
        tone === "weak" ? "border-pink/40 bg-pink/10" : "border-green/40 bg-green/10",
      )}
    >
      <span className="inline-flex items-center gap-1.5 text-[13px] text-fg-muted">
        {tone === "weak" ? <Target className="size-4 text-pink" aria-hidden /> : <ShieldCheck className="size-4 text-green" aria-hidden />}
        {tone === "weak" ? "أضعف محور" : "أقوى محور"}
      </span>
      <span className="text-lg leading-7 font-bold">{stat.label}</span>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-2xl font-bold tabular-nums">{formatPercent(stat.level)}</span>
        <Trend stat={stat} />
      </div>
      <span className="text-xs leading-5 text-fg-muted">
        {stat.labs === 1 ? "مختبر واحد يغطيه" : `${formatNumber(stat.labs)} مختبرات تغطيه`}
      </span>
    </div>
  );
}

/** The practice headline: how much was actually done inside the labs, and where the profile stands. */
export function LabsSummaryPanel({ insight }: { insight: LabInsights }) {
  const { summary } = insight;
  return (
    <DashboardPanel
      id="insights-labs-summary-title"
      title="مختبراتك العملية"
      subtitle="ما فعلته فعلاً داخل السيناريوهات: محاولات، وقت تدريب، ونقاط خبرة."
      action={<ViewAllLink href={routes.labs} label="كل المختبرات" />}
    >
      <StatGrid
        columns={4}
        stats={[
          { label: "مختبرات مكتملة", value: `${formatNumber(summary.labs)} / ${formatNumber(labs.length)}` },
          { label: "محاولات", value: formatNumber(summary.attempts) },
          { label: "وقت التدريب", value: formatDuration(summary.minutes) },
          { label: "نقاط الخبرة", value: `${formatNumber(summary.xp)} XP` },
        ]}
      />

      {summary.weakest && summary.strongest ? (
        <div className="grid gap-3 @xl:grid-cols-2">
          <SkillTile stat={summary.weakest} tone="weak" />
          <SkillTile stat={summary.strongest} tone="strong" />
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-fg-muted">
        <span>
          متوسط النتيجة: <strong className="text-fg tabular-nums">{formatPercent(summary.average)}</strong>
        </span>
        <span>
          ثبات الأداء: <strong className="text-fg tabular-nums">{formatPercent(summary.consistency)}</strong>
        </span>
        <span>
          شارات: <strong className="text-fg tabular-nums">{formatNumber(summary.badges)}</strong>
        </span>
        {summary.bestLab ? (
          <span className="inline-flex items-center gap-1">
            <Sparkles className="size-3.5 text-yellow" aria-hidden />
            أفضل نتيجة: <strong className="text-fg">{summary.bestLab.title}</strong>
            <span className="tabular-nums">({formatNumber(summary.bestLab.score)})</span>
          </span>
        ) : null}
      </div>
    </DashboardPanel>
  );
}
