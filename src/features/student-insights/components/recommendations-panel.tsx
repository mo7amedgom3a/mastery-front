import { brandBg, brandColorAt } from "@/components/ui/brand-colors";
import { ViewAllLink } from "@/components/ui/view-all-link";
import { routes } from "@/config/routes";
import { RecommendationGrid } from "@/features/student-dashboard/components/recommendation-grid";
import type { InsightsRecommendations } from "@/lib/api/insights";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";

/**
 * What the recommendation engine sees for this student: the fields it points to, then the
 * programs themselves (the same cards as the dashboard, shared cache).
 */
export function RecommendationsPanel({ recommendations }: { recommendations: InsightsRecommendations }) {
  const categories = recommendations.categories.slice(0, 5);
  return (
    <section aria-labelledby="insights-recommendations-title" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h2 id="insights-recommendations-title" className="m-0 text-xl leading-8 font-bold">
            اقتراحات على مقاسك
          </h2>
          <p className="m-0 text-sm text-fg-muted">
            {recommendations.personalized
              ? "اختارها محرّك التوصيات من أهدافك ونشاطك وما تملكه."
              : "الأكثر رواجاً الآن، وستصبح أدق كلما تعلّمت وتصفّحت أكثر."}
          </p>
        </div>
        <ViewAllLink href={routes.search} label="تصفّح البرامج" />
      </div>

      {categories.length ? (
        <ul aria-label="المجالات المقترحة" className="m-0 flex list-none flex-wrap gap-2 p-0">
          {categories.map((category, index) => (
            <li
              key={category.category_id}
              className={cn("flex items-center gap-2 rounded-chip px-3 py-1.5 text-sm font-semibold text-ink", brandBg[brandColorAt(index)])}
            >
              {category.name}
              <span className="text-xs font-normal tabular-nums">{formatNumber(category.count)}</span>
            </li>
          ))}
        </ul>
      ) : null}

      <RecommendationGrid limit={3} compactLoader />
    </section>
  );
}
