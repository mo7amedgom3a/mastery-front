"use client";

import { Building2, User } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState, type ReactNode } from "react";

import { cn } from "@/lib/cn";

import type { Audience, CatalogFeatureVM, Interval, PlanVM } from "../model/plans";
import { FeatureComparison } from "./feature-comparison";
import { PlanCard } from "./plan-card";

function Choice({ selected, onSelect, children }: { selected: boolean; onSelect: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn("ma-btn ma-btn--sm min-h-11 gap-2", selected ? "ma-btn--secondary" : "ma-btn--soft")}
    >
      {children}
    </button>
  );
}

/** Best live yearly saving for an audience, for the "سنوياً" chip. */
function bestYearlySaving(plans: PlanVM[]): number {
  return plans.filter((p) => p.interval === "year" && p.offer).reduce((best, p) => Math.max(best, p.offer!.percent), 0);
}

/**
 * Individuals ↔ companies and monthly ↔ yearly, then the matching plan cards and their feature
 * comparison. `?audience=company` opens on companies (the business page links here).
 */
export function PricingExplorer({ plans, catalog }: { plans: PlanVM[]; catalog: CatalogFeatureVM[] }) {
  const params = useSearchParams();
  const [audience, setAudience] = useState<Audience>(params.get("audience") === "company" ? "company" : "individual");
  const forAudience = plans.filter((p) => p.audience === audience);
  const intervals = new Set(forAudience.map((p) => p.interval));
  // Yearly first when it exists: that's where the offers are.
  const [picked, setPicked] = useState<Interval | null>(params.get("billing") === "month" ? "month" : null);
  const interval: Interval = picked && intervals.has(picked) ? picked : intervals.has("year") ? "year" : "month";
  const visible = forAudience.filter((p) => p.interval === interval).toSorted((a, b) => a.amount - b.amount);
  const saving = bestYearlySaving(forAudience);

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col items-center gap-4">
        <ul aria-label="الاشتراك لـ" className="m-0 flex list-none flex-wrap justify-center gap-2 p-0">
          <li>
            <Choice selected={audience === "individual"} onSelect={() => setAudience("individual")}>
              <User aria-hidden="true" className="size-4 fill-none" />
              للأفراد
            </Choice>
          </li>
          <li>
            <Choice selected={audience === "company"} onSelect={() => setAudience("company")}>
              <Building2 aria-hidden="true" className="size-4 fill-none" />
              للشركات والفرق
            </Choice>
          </li>
        </ul>
        {intervals.size > 1 ? (
          <ul aria-label="مدة الفوترة" className="m-0 flex list-none flex-wrap justify-center gap-2 p-0">
            <li>
              <Choice selected={interval === "month"} onSelect={() => setPicked("month")}>
                شهرياً
              </Choice>
            </li>
            <li>
              <Choice selected={interval === "year"} onSelect={() => setPicked("year")}>
                سنوياً
                {saving > 0 ? <span className="ma-tag ma-tag--coral">وفّر حتى {saving}٪</span> : null}
              </Choice>
            </li>
          </ul>
        ) : null}
      </div>

      {visible.length === 0 ? (
        <p className="m-0 rounded-panel border border-line p-6 text-center text-fg-muted">
          لا توجد باقات متاحة هنا حالياً. تواصل معنا وسنقترح عليك ما يناسبك.
        </p>
      ) : (
        <div className="grid items-stretch gap-6 md:grid-cols-2 lg:grid-cols-3">
          {visible.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>
      )}

      <FeatureComparison plans={visible} catalog={catalog} />
    </div>
  );
}
