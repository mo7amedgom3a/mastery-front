import { BadgeCheck, CalendarClock, RefreshCcw } from "lucide-react";
import { Suspense } from "react";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

import type { PricingPageData } from "./api/load-plans";
import { PlanCard } from "./components/plan-card";
import { PricingExplorer } from "./components/pricing-explorer";

const PROMISES = [
  { icon: RefreshCcw, text: "ألغِ متى شئت، ويبقى وصولك حتى نهاية الفترة المدفوعة" },
  { icon: CalendarClock, text: "يتجدد الاشتراك تلقائياً بنفس السعر الذي اشتركت به" },
  { icon: BadgeCheck, text: "شهادة معتمدة لكل برنامج تُكمله" },
];

/** `/subscriptions`: every published plan, for individuals and companies. */
export function SubscriptionsPage({ data }: { data: PricingPageData }) {
  return (
    <>
      <SiteHeader />
      <main id="main" className="ma-container flex flex-col gap-12 py-12 md:py-16">
        <header className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
          <span className="ma-tag ma-tag--soft">اشتراكات ماستري</span>
          <h1 className="m-0 text-4xl leading-[1.3] font-bold md:text-5xl">تعلّم بلا حدود باشتراك واحد</h1>
          <p className="m-0 max-w-[60ch] text-lg leading-8 text-fg-muted">
            دورات ودبلومات واستشارات مع الخبراء ومخطط تعلّم ذكي، في باقة تناسبك أنت أو فريقك. اختر الباقة، وابدأ اليوم.
          </p>
        </header>

        {/* useSearchParams needs a boundary; the fallback is the same cards without the toggles. */}
        <Suspense
          fallback={
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {data.plans
                .filter((p) => p.audience === "individual" && p.interval === "year")
                .map((plan) => (
                  <PlanCard key={plan.id} plan={plan} />
                ))}
            </div>
          }
        >
          <PricingExplorer plans={data.plans} catalog={data.catalog} />
        </Suspense>

        <ul className="m-0 grid list-none gap-4 p-0 md:grid-cols-3">
          {PROMISES.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-start gap-3 rounded-panel border border-line p-5 leading-7">
              <Icon aria-hidden="true" className="mt-1 size-5 shrink-0 fill-none text-accent" />
              {text}
            </li>
          ))}
        </ul>
      </main>
      <SiteFooter />
    </>
  );
}
