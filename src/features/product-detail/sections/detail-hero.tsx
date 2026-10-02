import { BookOpen, CalendarCheck, ChevronLeft, Clock, Layers, Star, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { AppLink } from "@/components/ui/app-link";
import { routes } from "@/config/routes";

import { TrainerAvatar } from "../components/trainer-avatar";
import { kindLabel, kindListLabel } from "../content/copy";
import { productFacts, type FactKey } from "../model/facts";
import type { ProductDetailVM } from "../model/types";

const AVATAR_SIZE = 96;
const factIcon: Record<FactKey, LucideIcon> = {
  duration: Clock,
  units: Layers,
  lessons: BookOpen,
  access: CalendarCheck,
};

/**
 * Hero on the theme's alt surface (reads in light and dark mode): title, summary, the headline facts
 * as large tiles, and a share action. The trainers' avatars straddle its bottom edge, each linking to
 * the trainer's profile. Server-rendered; the H1 is the LCP element.
 */
export function DetailHero({ product, share }: { product: ProductDetailVM; share?: ReactNode }) {
  const listHref = product.kind === "diploma" ? routes.diplomas : routes.courses;
  const facts = productFacts(product);

  return (
    <>
      <section aria-labelledby="product-title" className="bg-surface-alt text-fg">
        <div className="ma-container pt-8 pb-24 md:pt-12 md:pb-28">
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
                <AppLink href={listHref} className="text-fg-muted no-underline hover:text-fg">
                  {kindListLabel[product.kind]}
                </AppLink>
              </li>
              <li aria-hidden="true">
                <ChevronLeft className="size-4" />
              </li>
              <li aria-current="page" className="line-clamp-1 max-w-[40ch] text-fg">
                {product.title}
              </li>
            </ol>
          </nav>

          <div className="mt-8 flex max-w-[56rem] flex-col items-start md:mt-12">
            <div className="ma-cluster gap-2">
              <span className={product.kind === "diploma" ? "ma-tag ma-tag--yellow" : "ma-tag ma-tag--coral"}>
                {kindLabel[product.kind]}
              </span>
              {product.category ? <span className="ma-tag ma-tag--soft">{product.category}</span> : null}
            </div>
            {/* Share sits beside the title (below it on phones), where the decision to share is made. */}
            <div className="mt-6 flex w-full flex-col items-start gap-4 sm:flex-row sm:justify-between sm:gap-8">
              <h1
                id="product-title"
                className="m-0 text-[clamp(2rem,1.3rem+2.8vw,3.5rem)] leading-[1.35] font-bold text-balance"
              >
                {product.title}
              </h1>
              {share ? <div className="sm:mt-3">{share}</div> : null}
            </div>
            {product.summary ? (
              <p className="m-0 mt-6 max-w-[44rem] text-lg leading-8 text-fg-muted text-pretty">{product.summary}</p>
            ) : null}
            <ul aria-label="تفاصيل البرنامج" className="m-0 mt-10 flex list-none flex-wrap gap-3 p-0">
              {product.rating ? (
                <li className="flex items-center gap-3 rounded-panel border border-line bg-surface px-4 py-3">
                  <Star aria-hidden="true" className="size-6 fill-yellow text-yellow" />
                  <span className="sr-only">التقييم</span>
                  <span dir="ltr" className="text-lg font-bold tabular-nums md:text-xl">
                    {product.rating.toFixed(1)}
                  </span>
                </li>
              ) : null}
              {facts.map(({ key, label }) => {
                const Icon = factIcon[key];
                return (
                  <li key={key} className="flex items-center gap-3 rounded-panel border border-line bg-surface px-4 py-3">
                    <Icon aria-hidden="true" className="size-6 shrink-0 text-accent" />
                    <span className="text-lg font-bold md:text-xl">{label}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </section>

      {product.trainers.length > 0 ? (
        <div className="ma-container relative z-10">
          <ul
            aria-label={product.trainers.length > 1 ? "المدربون" : "المدرب"}
            className="m-0 flex list-none flex-wrap gap-x-8 gap-y-4 p-0"
            style={{ marginTop: -AVATAR_SIZE / 2 }}
          >
            {product.trainers.map((trainer, index) => (
              <li key={trainer.id}>
                <AppLink href={trainer.href} className="group flex items-end gap-4 text-fg no-underline">
                  <TrainerAvatar
                    trainer={trainer}
                    size={AVATAR_SIZE}
                    index={index}
                    className="ring-4 ring-surface transition-transform duration-200 group-hover:-translate-y-1 motion-reduce:transition-none"
                  />
                  <span className="flex flex-col pb-1">
                    <span className="text-xs text-fg-muted">المدرب</span>
                    <span className="font-bold underline-offset-4 group-hover:underline">{trainer.name}</span>
                  </span>
                </AppLink>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </>
  );
}
