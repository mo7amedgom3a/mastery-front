"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { INSIGHTS_RANGES, insightsQueries, type InsightsRange } from "@/lib/api/insights";
import { cn } from "@/lib/cn";
import { formatDayLong } from "./model/format";

import { ActivityPanel } from "./components/activity-panel";
import { CategoriesPanel } from "./components/categories-panel";
import { CoursesPanel } from "./components/courses-panel";
import { InterestsPanel } from "./components/interests-panel";
import { LabsInsightsSection } from "./components/labs-insights";
import { PanelEmpty } from "./components/panel-states";
import { PlannerPanel } from "./components/planner-panel";
import { ProfilePanel } from "./components/profile-panel";
import { QuizPanel } from "./components/quiz-panel";
import { RangeFilter } from "./components/range-filter";
import { RecommendationsPanel } from "./components/recommendations-panel";
import { RhythmPanel } from "./components/rhythm-panel";
import { SkillsPanel } from "./components/skills-panel";
import { SummaryCard } from "./components/summary-card";

function parseRange(value: string | null): InsightsRange {
  return INSIGHTS_RANGES.includes(value as InsightsRange) ? (value as InsightsRange) : "30d";
}

function InsightsSkeleton() {
  return (
    <div role="status" className="grid gap-6 @4xl:grid-cols-2">
      <span className="sr-only">جارٍ تجهيز رؤاك…</span>
      <Skeleton className="h-40 rounded-panel @4xl:col-span-2" />
      <Skeleton className="h-96 rounded-panel @4xl:col-span-2" />
      <Skeleton className="h-72 rounded-panel" />
      <Skeleton className="h-72 rounded-panel" />
    </div>
  );
}

/** The student's personal learning report: one overview call, then a panel per question. */
export function InsightsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const range = parseRange(searchParams.get("range"));
  const overview = useQuery({ ...insightsQueries.overview(range), placeholderData: keepPreviousData });

  const setRange = (next: InsightsRange) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "30d") params.delete("range");
    else params.set("range", next);
    const query = params.toString();
    router.replace((query ? `${pathname}?${query}` : pathname) as Route, { scroll: false });
  };

  const data = overview.data;

  return (
    <div className="@container flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <RangeFilter value={range} onChange={setRange} />
        {data ? (
          <p className="m-0 text-[13px] text-fg-muted">
            {`من ${formatDayLong(data.starts_on)} إلى ${formatDayLong(data.ends_on)}`}
          </p>
        ) : null}
      </div>

      {overview.isPending ? (
        <InsightsSkeleton />
      ) : overview.isError || !data ? (
        <PanelEmpty
          action={
            <Button variant="secondary" size="sm" onClick={() => void overview.refetch()}>
              إعادة المحاولة
            </Button>
          }
        >
          تعذّر تحميل رؤاك الآن. تحقّق من اتصالك ثم حاول مجدداً.
        </PanelEmpty>
      ) : (
        <div
          aria-busy={overview.isPlaceholderData}
          className={cn("grid gap-6 transition-opacity @4xl:grid-cols-2", overview.isPlaceholderData && "opacity-60")}
        >
          <div className="@4xl:col-span-2">
            <SummaryCard range={range} />
          </div>
          <div className="@4xl:col-span-2">
            <ActivityPanel activity={data.activity} range={range} />
          </div>
          <RhythmPanel activity={data.activity} />
          <ProfilePanel profile={data.profile} />
          <div className="@4xl:col-span-2">
            <CoursesPanel learning={data.learning} />
          </div>
          <InterestsPanel interests={data.interests} />
          <CategoriesPanel categories={data.categories} />
          <SkillsPanel skills={data.skills} />
          <div className="@4xl:col-span-2 min-w-0">
            <LabsInsightsSection range={range} />
          </div>
          <PlannerPanel weeks={data.planner} />
          <div className="@4xl:col-span-2">
            <QuizPanel />
          </div>
          <div className="@4xl:col-span-2">
            <RecommendationsPanel recommendations={data.recommendations} />
          </div>
        </div>
      )}
    </div>
  );
}
