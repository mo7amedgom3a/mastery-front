import { ArrowRight, Check, Repeat } from "lucide-react";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { AppLink } from "@/components/ui/app-link";
import { routes } from "@/config/routes";
import { cn } from "@/lib/cn";

import { FeatureIcon } from "./components/feature-icon";
import { PlanPrice } from "./components/plan-card";
import { SubscribePanel } from "./components/subscribe-panel";
import { PLAN_TYPE_LABELS, RESOURCE_TYPE_LABELS, type PlanVM } from "./model/plans";

function groupResources(plan: PlanVM) {
  const groups = new Map<string, PlanVM["resources"]>();
  for (const resource of plan.resources) {
    const key = resource.selectable ? "selectable" : resource.type;
    groups.set(key, [...(groups.get(key) ?? []), resource]);
  }
  return groups;
}

/** `/subscriptions/[slug]`: everything a plan includes, and the subscribe action. */
export function PlanDetailPage({ plan }: { plan: PlanVM }) {
  const groups = groupResources(plan);
  return (
    <>
      <SiteHeader />
      <main id="main" className="ma-container flex flex-col gap-12 py-10 md:py-14">
        <AppLink href={routes.subscriptions} className="inline-flex items-center gap-2 text-fg-muted">
          <ArrowRight aria-hidden="true" className="size-4 fill-none" />
          كل الباقات
        </AppLink>

        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="flex flex-col gap-10">
            <header className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-2">
                <span className="ma-tag ma-tag--soft">{plan.audience === "company" ? "للشركات والفرق" : "للأفراد"}</span>
                <span className="ma-tag ma-tag--soft">{PLAN_TYPE_LABELS[plan.planType]}</span>
                <span className="ma-tag ma-tag--soft">
                  <Repeat aria-hidden="true" className="size-3.5 fill-none" />
                  {plan.interval === "year" ? "اشتراك سنوي" : "اشتراك شهري"}
                </span>
              </div>
              <h1 className="m-0 text-4xl leading-[1.3] font-bold">{plan.title}</h1>
              {plan.subtitle ? <p className="m-0 text-xl leading-8">{plan.subtitle}</p> : null}
              {plan.description ?? plan.summary ? (
                <p className="m-0 max-w-[65ch] text-lg leading-8 text-fg-muted">{plan.description ?? plan.summary}</p>
              ) : null}
            </header>

            {plan.features.length > 0 ? (
              <section aria-labelledby="features-title" className="flex flex-col gap-5">
                <h2 id="features-title" className="m-0 text-2xl font-bold">
                  ماذا يشمل اشتراكك
                </h2>
                <ul className="m-0 grid list-none gap-4 p-0 md:grid-cols-2">
                  {plan.features.map((feature) => (
                    <li
                      key={feature.key}
                      className={cn("flex gap-4 rounded-panel border p-5", feature.highlighted ? "border-line-strong" : "border-line")}
                    >
                      <FeatureIcon name={feature.icon} />
                      <div className="flex flex-col gap-1">
                        <h3 className="m-0 text-lg font-bold">{feature.title}</h3>
                        {feature.value ? <p className="m-0 text-sm font-bold text-accent">{feature.value}</p> : null}
                        {feature.description ? <p className="m-0 leading-7 text-fg-muted">{feature.description}</p> : null}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {plan.planType === "choose_x" && plan.selectionAllowance ? (
              <section className="rounded-panel border border-line-strong p-6">
                <h2 className="m-0 text-xl font-bold">اختر {plan.selectionAllowance} برامج على مدار السنة</h2>
                <p className="m-0 mt-2 leading-7 text-fg-muted">
                  اختر البرامج متى شئت خلال سنة اشتراكك، ويمكنك استبدال أي برنامج ما دمت لم تبدأ التعلّم فيه بعد. مع
                  التجديد السنوي يتجدد رصيدك كاملاً.
                </p>
              </section>
            ) : null}

            {groups.size > 0 ? (
              <section aria-labelledby="resources-title" className="flex flex-col gap-5">
                <h2 id="resources-title" className="m-0 text-2xl font-bold">
                  البرامج المشمولة
                </h2>
                {[...groups.entries()].map(([key, items]) => (
                  <div key={key} className="flex flex-col gap-3">
                    <h3 className="m-0 text-lg font-bold">
                      {key === "selectable" ? `تختار منها (${items.length})` : `${RESOURCE_TYPE_LABELS[key] ?? key} (${items.length})`}
                    </h3>
                    <ul className="m-0 grid list-none gap-2 p-0 md:grid-cols-2">
                      {items.map((item) => (
                        <li key={item.productId} className="flex items-start gap-2 leading-7">
                          <Check aria-hidden="true" className="mt-1.5 size-4 shrink-0 fill-none text-accent" />
                          <span>
                            {item.title}
                            {key === "selectable" ? (
                              <span className="text-sm text-fg-muted"> · {RESOURCE_TYPE_LABELS[item.type] ?? item.type}</span>
                            ) : null}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </section>
            ) : null}
          </div>

          <aside aria-label="الاشتراك في الباقة" className="lg:sticky lg:top-[calc(var(--header-h)+1.5rem)]">
            <div className={plan.spotlight ? "ma-plan-glow" : undefined}>
              <div className="ma-plan">
                {plan.spotlight ? <span className="ma-tag ma-tag--coral ma-plan__ribbon">الأفضل قيمة</span> : null}
                <PlanPrice plan={plan} />
                {plan.cardItems.length > 0 ? (
                  <ul className="ma-plan__features">
                    {plan.cardItems.map((item) => (
                      <li key={item}>
                        <span className="ma-plan__icon">
                          <Check aria-hidden="true" />
                        </span>
                        <span className="pt-1">{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
                <SubscribePanel plan={plan} />
              </div>
            </div>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
