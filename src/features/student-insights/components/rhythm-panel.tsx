import { DashboardPanel } from "@/features/student-dashboard/components/dashboard-panel";
import type { InsightsActivity } from "@/lib/api/insights";
import { cn } from "@/lib/cn";

import { HEATMAP_DAYS, SURFACE_LABELS, formatDuration, hourLabel, peakTimes } from "../model/format";
import { PanelEmpty } from "./panel-states";

/** 0..4 intensity steps; empty cells stay as hairline outlines. */
function level(value: number, max: number): number {
  if (value <= 0 || max <= 0) return 0;
  return Math.min(4, Math.ceil((value / max) * 4));
}

const LEVEL_CLASS = [
  "bg-line",
  "bg-coral/25",
  "bg-coral/50",
  "bg-coral/75",
  "bg-coral",
];

/** Learning-rhythm heatmap: weekdays × hours of the day, in the student's own timezone. */
export function RhythmPanel({ activity }: { activity: InsightsActivity }) {
  const peak = peakTimes(activity);
  const max = Math.max(0, ...activity.heatmap.flat());
  const surfaces = activity.by_surface;
  const surfaceTotal = surfaces.reduce((sum, item) => sum + item.minutes, 0);

  return (
    <DashboardPanel
      id="insights-rhythm-title"
      title="متى تتعلّم؟"
      subtitle={
        peak
          ? `أكثر أوقاتك نشاطاً حوالي ${hourLabel(peak.hour)}، وأكثر أيامك ${peak.day}.`
          : "خريطة أيامك وساعاتك المفضّلة للتعلّم"
      }
    >
      {!peak ? (
        <PanelEmpty>ستظهر خريطة أوقاتك بعد أول جلسات تعلّم لك.</PanelEmpty>
      ) : (
        <>
          <div className="overflow-x-auto [contain:paint]">
            <table className="w-full min-w-[560px] table-fixed border-separate border-spacing-[3px] text-[11px]">
              <caption className="sr-only">دقائق النشاط لكل يوم وساعة</caption>
              <colgroup>
                <col className="w-12" />
                {Array.from({ length: 24 }, (_, hour) => (
                  <col key={hour} />
                ))}
              </colgroup>
              <thead>
                <tr>
                  <th scope="col">
                    <span className="sr-only">اليوم</span>
                  </th>
                  {Array.from({ length: 24 }, (_, hour) => (
                    <th key={hour} scope="col" className="overflow-visible p-0 text-start font-normal whitespace-nowrap text-fg-muted">
                      {hour % 3 === 0 ? hourLabel(hour) : <span className="sr-only">{hourLabel(hour)}</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {HEATMAP_DAYS.map((day) => (
                  <tr key={day.index}>
                    <th scope="row" className="pe-1 text-start font-normal whitespace-nowrap text-fg-muted">
                      {day.short}
                    </th>
                    {(activity.heatmap[day.index] ?? []).map((minutes, hour) => (
                      <td
                        key={hour}
                        title={`${day.label} ${hourLabel(hour)}: ${formatDuration(minutes)}`}
                        className={cn("h-5 rounded-none p-0", LEVEL_CLASS[level(minutes, max)])}
                      >
                        <span className="sr-only">{`${day.label} ${hourLabel(hour)}: ${formatDuration(minutes)}`}</span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div aria-hidden="true" className="flex items-center justify-end gap-1.5 text-[11px] text-fg-muted">
            أقل
            {LEVEL_CLASS.map((cls) => (
              <span key={cls} className={cn("size-3 rounded-none", cls)} />
            ))}
            أكثر
          </div>

          {surfaces.length ? (
            <div className="flex flex-col gap-2">
              <h3 className="m-0 text-sm font-bold">أين تقضي وقتك</h3>
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {surfaces.map((item) => {
                  const share = surfaceTotal ? (item.minutes / surfaceTotal) * 100 : 0;
                  return (
                    <li key={item.surface} className="grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-3 text-[13px]">
                      <span className="truncate">{SURFACE_LABELS[item.surface] ?? item.surface}</span>
                      <span className="h-2 overflow-hidden rounded-full bg-line">
                        <span className="block h-full rounded-full bg-sky" style={{ width: `${share}%` }} />
                      </span>
                      <span className="font-semibold tabular-nums">{formatDuration(item.minutes)}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
        </>
      )}
    </DashboardPanel>
  );
}
