"use client";

import { ArrowLeft, CheckCircle2, Route } from "lucide-react";

import { AppLink } from "@/components/ui/app-link";
import { brandBg } from "@/components/ui/brand-colors";
import { routes } from "@/config/routes";
import { cn } from "@/lib/cn";

import { company, journey } from "../../content/nuqta/company";
import { findLab } from "../../model/catalog";
import { bestScore, type Attempt } from "../../model/progress-store";

/** «رحلة شركة نقطة»: the six connected labs in order, with the learner's best score on each. */
export function JourneyStrip({ attempts }: { attempts: readonly Attempt[] }) {
  const done = journey.filter((step) => bestScore(attempts, step.slug) !== null).length;
  return (
    <section aria-labelledby="labs-journey" className="flex flex-col gap-4 rounded-panel border border-line bg-surface p-5 md:p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 id="labs-journey" className="m-0 inline-flex items-center gap-2 text-xl font-bold">
            <Route className="size-5 text-accent" aria-hidden /> رحلة شركة {company.name}
          </h2>
          <p className="m-0 max-w-[70ch] text-[13px] leading-6 text-fg-muted">
            شركة واحدة من التأسيس إلى الاستحواذ: سجّلها في السعودية، ابنِ حوكمتها، خطّط نقدها، أقفل ربعها، أدِر أزمتها، وافحص صفقتها. كل مختبر مستقل، والترتيب يحكي القصة.
          </p>
        </div>
        <span className="rounded-chip bg-surface-alt px-3 py-1 text-[13px] font-semibold tabular-nums">
          {done} / {journey.length}
        </span>
      </header>
      <ol className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {journey.map((step) => {
          const lab = findLab(step.slug);
          const best = bestScore(attempts, step.slug);
          if (!lab) return null;
          return (
            <li key={step.slug}>
              <AppLink
                href={routes.lab(step.slug)}
                className={cn(
                  "group flex h-full flex-col gap-2 rounded-photo border p-3 transition-colors hover:border-line-strong",
                  best !== null ? "border-green" : "border-line",
                )}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className={cn("flex size-7 items-center justify-center rounded-full text-[13px] font-bold text-ink", brandBg[lab.color])}>{step.step}</span>
                  {best !== null ? (
                    <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-green tabular-nums">
                      <CheckCircle2 className="size-4" aria-hidden /> {best}
                    </span>
                  ) : (
                    <ArrowLeft className="size-4 text-fg-muted transition-transform group-hover:-translate-x-0.5" aria-hidden />
                  )}
                </span>
                <span className="text-sm leading-6 font-bold">{step.short}</span>
                <span className="text-[12px] leading-5 text-fg-muted">{lab.categoryName}</span>
              </AppLink>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
