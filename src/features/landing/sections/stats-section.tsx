import { CountUp } from "@/components/motion/count-up";

import type { StatVM } from "../model/types";

/**
 * Compact insights row under the hero: number and label on one line, separated by hairline rules
 * (kit "rules, not boxes"). Live counters from the insights API; hidden if none.
 */
export function StatsSection({ stats }: { stats: StatVM[] }) {
  if (stats.length === 0) {
    return null;
  }
  return (
    <section aria-labelledby="stats-title" className="border-y border-line bg-surface-alt">
      <div className="ma-container">
        <h2 id="stats-title" className="sr-only">
          ماستري بالأرقام
        </h2>
        <dl className="m-0 grid grid-cols-2 gap-x-6 gap-y-5 py-6 md:flex md:flex-wrap md:items-center md:justify-between md:gap-0 md:py-7">
          {stats.map((stat) => (
            <div
              key={stat.key}
              className="flex items-baseline gap-2 whitespace-nowrap md:border-s md:border-line md:px-8 md:first:border-s-0 md:first:ps-0 md:last:pe-0"
            >
              <dt className="order-2 text-sm text-fg-muted md:text-base">{stat.label}</dt>
              <dd className="order-1 m-0 text-2xl leading-none font-bold md:text-3xl">
                <CountUp value={stat.value} prefix="+" />
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
