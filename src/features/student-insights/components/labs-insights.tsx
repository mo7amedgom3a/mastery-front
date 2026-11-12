"use client";

import { FlaskConical } from "lucide-react";

import { Button, ButtonLink } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/config/routes";
import { DashboardPanel } from "@/features/student-dashboard/components/dashboard-panel";
import { LabCard } from "@/features/labs/components/labs-progress";
import { labs } from "@/features/labs/model/catalog";
import { seedDemoProgress } from "@/features/labs/model/demo-progress";
import type { InsightsRange } from "@/lib/api/insights";

import { useLabInsights } from "../model/use-lab-insights";
import { BehaviorMapPanel } from "./behavior-map-panel";
import { BehaviorTimeline } from "./behavior-timeline";
import { DimensionHeatmap } from "./dimension-heatmap";
import { GrowthPathPanel } from "./growth-path-panel";
import { LabsSummaryPanel } from "./labs-summary-panel";
import { ObservationsPanel } from "./observations-panel";
import { PanelEmpty } from "./panel-states";

const STARTERS = labs.slice(0, 3);

function LabsInsightsSkeleton() {
  return (
    <div role="status" className="flex flex-col gap-6">
      <span className="sr-only">جارٍ قراءة محاولاتك في المختبرات…</span>
      <Skeleton className="h-64 rounded-panel" />
      <Skeleton className="h-80 rounded-panel" />
      <Skeleton className="h-72 rounded-panel" />
    </div>
  );
}

function StarterPanel() {
  return (
    <DashboardPanel
      id="insights-labs-starter-title"
      title="لم تدخل مختبرًا بعد"
      subtitle="هنا يظهر تحليل سلوكك الحقيقي داخل السيناريوهات: أين تنجح، وأين تفقد النقاط، وما الذي تدرّبه بعدها."
    >
      <p className="m-0 max-w-[70ch] text-sm leading-6 text-fg-muted">
        اختر سيناريو، وحقق هدفه بالأرقام، وسيسجّل المراقب لحظاتك وقراراتك. بعد أول محاولة ستُبنى هنا خريطة مهاراتك،
        خط تطوّرك، وملاحظات على سلوكك — ومنها توصيات البرامج والاستشارات.
      </p>
      <ul className="m-0 grid list-none gap-4 p-0 @xl:grid-cols-2 @4xl:grid-cols-3">
        {STARTERS.map((lab) => (
          <li key={lab.slug}>
            <LabCard lab={lab} attempts={[]} headingLevel="h3" />
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center gap-3">
        <ButtonLink href={routes.labs} size="sm">
          <FlaskConical className="size-4" aria-hidden /> كل المختبرات
        </ButtonLink>
        <Button variant="secondary" size="sm" onClick={() => seedDemoProgress()}>
          اعرض تقريرًا تجريبيًا
        </Button>
        <span className="text-xs leading-5 text-fg-muted">
          يضيف خمس محاولات تجريبية إلى هذا المتصفح فقط، ويمكنك حذفها من صفحة المختبرات.
        </span>
      </div>
    </DashboardPanel>
  );
}

/**
 * The lab half of the insights report: practice summary, behaviour map, timeline, skill heatmap,
 * the observer's notes and the growth path. Reads the local labs store, so it renders after hydration.
 */
export function LabsInsightsSection({ range }: { range: InsightsRange }) {
  const { hydrated, attempts, hasAny, insight } = useLabInsights(range);

  if (!hydrated) return <LabsInsightsSkeleton />;
  if (!hasAny) return <StarterPanel />;

  return (
    <div className="flex min-w-0 flex-col gap-6">
      {!attempts.length ? (
        <DashboardPanel
          id="insights-labs-empty-title"
          title="لا محاولات في هذه الفترة"
          subtitle="المختبرات تحتفظ بمحاولاتك كلها؛ غيّر المدى الزمني أو ابدأ محاولة جديدة."
        >
          <PanelEmpty
            action={
              <ButtonLink href={routes.labs} size="sm">
                ابدأ مختبرًا
              </ButtonLink>
            }
          >
            لا توجد محاولات مسجّلة داخل المدى المحدد. اختر «آخر سنة» لرؤية تاريخك الكامل في المختبرات.
          </PanelEmpty>
        </DashboardPanel>
      ) : (
        <>
          <LabsSummaryPanel insight={insight} />
          <BehaviorMapPanel insight={insight} />
          <BehaviorTimeline insight={insight} />
          <DimensionHeatmap insight={insight} />
          <ObservationsPanel insight={insight} />
          <GrowthPathPanel insight={insight} />
        </>
      )}
    </div>
  );
}
