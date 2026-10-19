import { Check, Minus } from "lucide-react";

import type { CatalogFeatureVM, PlanVM } from "../model/plans";
import { FeatureIcon } from "./feature-icon";

/** Catalog features down the side, the visible plans across: ✓, the plan's value, or —. */
export function FeatureComparison({ plans, catalog }: { plans: PlanVM[]; catalog: CatalogFeatureVM[] }) {
  const offered = catalog.filter((feature) => plans.some((plan) => plan.features.some((f) => f.key === feature.key)));
  if (plans.length < 2 || offered.length === 0) return null;
  return (
    <section aria-labelledby="compare-title" className="flex flex-col gap-4">
      <h2 id="compare-title" className="m-0 text-2xl font-bold">
        قارن بين الباقات
      </h2>
      <div className="overflow-x-auto rounded-panel border border-line">
        <table className="ma-compare">
          <caption className="sr-only">المزايا المتاحة في كل باقة</caption>
          <thead>
            <tr>
              <th scope="col">الميزة</th>
              {plans.map((plan) => (
                <th key={plan.id} scope="col" className="min-w-36">
                  <span className="block font-bold text-fg">{plan.title}</span>
                  <span dir="ltr">{plan.price}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {offered.map((feature) => (
              <tr key={feature.key}>
                <th scope="row" className="font-normal">
                  <span className="flex items-center gap-3">
                    <FeatureIcon name={feature.icon} />
                    <span>
                      <span className="block font-bold">{feature.title}</span>
                      {feature.description ? <span className="block text-sm text-fg-muted">{feature.description}</span> : null}
                    </span>
                  </span>
                </th>
                {plans.map((plan) => {
                  const included = plan.features.find((f) => f.key === feature.key);
                  return (
                    <td key={plan.id}>
                      {included ? (
                        included.value ? (
                          <span className="text-sm font-bold">{included.value}</span>
                        ) : (
                          <Check aria-label="متاحة" className="mx-auto size-5 fill-none text-accent" />
                        )
                      ) : (
                        <Minus aria-label="غير متاحة" className="mx-auto size-5 fill-none text-fg-muted" />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
