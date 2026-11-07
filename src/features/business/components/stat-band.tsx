import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";

import type { StatVM } from "../model/b2b-view";

/**
 * The proof band. Values are rendered final on the server and only re-animated on the client, so the
 * numbers are correct with JS disabled or reduced motion.
 */
export function StatBand({ stats, className }: { stats: StatVM[]; className?: string }) {
  if (stats.length === 0) {
    return null;
  }
  return (
    <dl className={cn("b2b-stats", className)} data-b2b-stagger>
      {stats.map((stat) => (
        <div key={stat.key} className="b2b-stat">
          <dt className="b2b-stat__label">{stat.label}</dt>
          <dd className="b2b-stat__value">
            <span dir="ltr" className="b2b-stat__digits">
              <span data-b2b-count data-count={stat.value}>
                {formatNumber(stat.value)}
              </span>
              {stat.suffix ? (
                <span aria-hidden="true" className="b2b-stat__suffix">
                  {stat.suffix}
                </span>
              ) : null}
            </span>
          </dd>
        </div>
      ))}
    </dl>
  );
}
