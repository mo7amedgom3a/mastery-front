import { seriesColor } from "@/components/ui/chart";
import { DashboardPanel } from "@/features/student-dashboard/components/dashboard-panel";
import type { InsightsCategory } from "@/lib/api/insights";
import { formatNumber } from "@/lib/format";

import { formatDuration, formatPercent } from "../model/format";
import { PanelEmpty } from "./panel-states";

const MAX_ROWS = 8;

/**
 * Owned programs per learning field. The bar is the field's share of the student's programs;
 * the progress and active time sit beside it. Plain rows rather than an SVG chart so long Arabic
 * field names wrap naturally and the numbers stay readable at phone width.
 */
export function CategoriesPanel({ categories }: { categories: InsightsCategory[] }) {
  const rows = categories.slice(0, MAX_ROWS);
  const most = Math.max(1, ...rows.map((row) => row.products));

  return (
    <DashboardPanel id="insights-categories-title" title="مجالات تعلّمك" subtitle="برامجك موزّعة على المجالات، مع إنجازك ووقتك في كل مجال">
      {rows.length === 0 ? (
        <PanelEmpty>ستظهر هنا مجالات برامجك بعد أول اشتراك.</PanelEmpty>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-4 p-0">
          {rows.map((row, index) => (
            <li key={row.category_id} className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between gap-3">
                <span className="min-w-0 font-semibold">{row.name}</span>
                <span className="shrink-0 text-[13px] text-fg-muted tabular-nums">
                  {`${formatNumber(row.products)} ${row.products === 1 ? "برنامج" : "برامج"}`}
                </span>
              </div>
              <div
                role="img"
                aria-label={`${row.name}: ${formatNumber(row.products)} برامج، إنجاز ${formatPercent(row.average_progress)}`}
                className="h-2.5 overflow-hidden rounded-full bg-line"
              >
                <span
                  className="block h-full rounded-full"
                  style={{ width: `${(row.products / most) * 100}%`, background: seriesColor(index) }}
                />
              </div>
              <span className="text-[13px] text-fg-muted">
                {`الإنجاز ${formatPercent(row.average_progress)}`}
                {row.minutes ? ` · ${formatDuration(row.minutes)} تعلّم` : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
    </DashboardPanel>
  );
}
