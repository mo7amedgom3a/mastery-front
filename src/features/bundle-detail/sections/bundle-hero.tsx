import { CalendarCheck, ChevronLeft, Layers, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { AppLink } from "@/components/ui/app-link";
import { routes } from "@/config/routes";

import type { BundleDetailVM } from "../model/types";

/** Headline facts shown in the hero and on the share card, in display order. */
export function bundleFacts(bundle: BundleDetailVM): { key: string; icon: LucideIcon; label: string }[] {
  return [
    ...bundle.composition.map((part) => ({ key: part.kind, icon: Layers, label: part.label })),
    ...(bundle.access ? [{ key: "access", icon: CalendarCheck, label: bundle.access }] : []),
  ];
}

/**
 * Bundle hero, in the package page's visual language: breadcrumb, title, summary, what the bundle
 * holds as fact tiles, and share. Server-rendered; the H1 is the LCP element.
 */
export function BundleHero({ bundle, share }: { bundle: BundleDetailVM; share?: ReactNode }) {
  return (
    <section aria-labelledby="product-title" className="bg-surface-alt text-fg">
      <div className="ma-container pt-8 pb-16 md:pt-12 md:pb-20">
        <nav aria-label="مسار التصفح">
          <ol className="m-0 flex list-none flex-wrap items-center gap-1 p-0 text-sm text-fg-muted">
            <li>
              <AppLink href={routes.home} className="text-fg-muted no-underline hover:text-fg">
                الرئيسية
              </AppLink>
            </li>
            <li aria-hidden="true">
              <ChevronLeft className="size-4" />
            </li>
            <li>
              <AppLink href={routes.section("bundles")} className="text-fg-muted no-underline hover:text-fg">
                حزم ماستري
              </AppLink>
            </li>
            <li aria-hidden="true">
              <ChevronLeft className="size-4" />
            </li>
            <li aria-current="page" className="line-clamp-1 max-w-[40ch] text-fg">
              {bundle.title}
            </li>
          </ol>
        </nav>

        <div className="mt-8 flex max-w-[56rem] flex-col items-start md:mt-12">
          <div className="ma-cluster gap-2">
            <span className="ma-tag ma-tag--sky">حزمة ماستري</span>
            {bundle.savings ? <span className="ma-tag ma-tag--soft">وفّر {bundle.savings.percent}٪</span> : null}
            {bundle.categories.map((category) => (
              <span key={category} className="ma-tag ma-tag--soft">
                {category}
              </span>
            ))}
          </div>
          <div className="mt-6 flex w-full flex-col items-start gap-4 sm:flex-row sm:justify-between sm:gap-8">
            <h1
              id="product-title"
              className="m-0 text-[clamp(2rem,1.3rem+2.8vw,3.5rem)] leading-[1.35] font-bold text-balance"
            >
              {bundle.title}
            </h1>
            {share ? <div className="sm:mt-3">{share}</div> : null}
          </div>
          {bundle.summary ? (
            <p className="m-0 mt-6 max-w-[44rem] text-lg leading-8 text-fg-muted text-pretty">{bundle.summary}</p>
          ) : null}
          <ul aria-label="تفاصيل الحزمة" className="m-0 mt-10 flex list-none flex-wrap gap-3 p-0">
            {bundleFacts(bundle).map(({ key, icon: Icon, label }) => (
              <li key={key} className="flex items-center gap-3 rounded-panel border border-line bg-surface px-4 py-3">
                <Icon aria-hidden="true" className="size-6 shrink-0 text-accent" />
                <span className="text-lg font-bold md:text-xl">{label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
