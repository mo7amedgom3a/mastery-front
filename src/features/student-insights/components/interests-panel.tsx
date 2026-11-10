import { seriesColor } from "@/components/ui/chart";
import { DashboardPanel } from "@/features/student-dashboard/components/dashboard-panel";
import type { InsightsInterest } from "@/lib/api/insights";
import { formatNumber } from "@/lib/format";

import { formatDuration } from "../model/format";
import { PanelEmpty } from "./panel-states";

/** Plain-language reasons behind a category's score. */
function reasons(interest: InsightsInterest): string {
  const parts = [
    interest.owned ? `${formatNumber(interest.owned)} برامج تملكها` : null,
    interest.views ? `${formatNumber(interest.views)} زيارة` : null,
    interest.wishlist ? `${formatNumber(interest.wishlist)} في المفضّلة` : null,
    interest.minutes ? `${formatDuration(interest.minutes)} تعلّم` : null,
    interest.skill_matches ? "يطابق مهاراتك المستهدفة" : null,
  ].filter(Boolean);
  return parts.join(" · ");
}

/**
 * Top interest categories: one stacked strip showing how the interest splits, then a ranked list
 * that explains each share. Built from views, wishlist, ownership, active time and target skills.
 */
export function InterestsPanel({ interests }: { interests: InsightsInterest[] }) {
  return (
    <DashboardPanel id="insights-interests-title" title="أكثر ما يشدّك" subtitle="المجالات التي تهتم بها على المنصّة، من تصفّحك ومشترياتك ووقتك">
      {interests.length === 0 ? (
        <PanelEmpty>تصفّح البرامج وأضف ما يعجبك إلى المفضّلة لنتعرّف على اهتماماتك.</PanelEmpty>
      ) : (
        <>
          <div aria-hidden="true" className="flex h-4 w-full overflow-hidden rounded-full">
            {interests.map((interest, index) => (
              <span
                key={interest.category_id}
                className="h-full"
                style={{ width: `${interest.share * 100}%`, background: seriesColor(index) }}
              />
            ))}
          </div>
          <ol className="m-0 flex list-none flex-col gap-3 p-0">
            {interests.map((interest, index) => (
              <li key={interest.category_id} className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className="mt-1.5 size-3 shrink-0 rounded-full"
                  style={{ background: seriesColor(index) }}
                />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate font-semibold">
                      <span className="sr-only">{`المرتبة ${index + 1}: `}</span>
                      {interest.name}
                    </span>
                    <span className="shrink-0 font-bold tabular-nums">{formatNumber(Math.round(interest.share * 100))}٪</span>
                  </div>
                  <span className="text-[13px] leading-5 text-fg-muted">{reasons(interest)}</span>
                </div>
              </li>
            ))}
          </ol>
        </>
      )}
    </DashboardPanel>
  );
}
