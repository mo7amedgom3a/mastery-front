import { BookOpen, CalendarCheck, ChevronLeft, Clock, Layers, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { AppLink } from "@/components/ui/app-link";
import { routes } from "@/config/routes";
import { TrainerAvatar } from "@/features/product-detail/components/trainer-avatar";
import { formatCount } from "@/lib/format";

import { packageFacts, type PackageFactKey } from "../model/facts";
import type { PackageDetailVM } from "../model/types";

const AVATAR_SIZE = 72;
/** Avatars shown in the strip; the rest are counted. */
const MAX_AVATARS = 5;
const OTHER_TRAINER_FORMS = { one: "مدرب آخر", two: "مدربان آخران", few: "مدربين آخرين", many: "مدرباً آخر" };
const factIcon: Record<PackageFactKey, LucideIcon> = {
  items: Layers,
  duration: Clock,
  lessons: BookOpen,
  access: CalendarCheck,
};

/**
 * Package hero, in the course page's visual language: breadcrumb, title, summary, the headline facts
 * as tiles, and share. The trainers of every included course straddle its bottom edge as an
 * overlapping avatar strip. Server-rendered; the H1 is the LCP element.
 */
export function PackageHero({ product, share }: { product: PackageDetailVM; share?: ReactNode }) {
  const facts = packageFacts(product);
  const shown = product.trainers.slice(0, MAX_AVATARS);
  const hidden = product.trainers.length - shown.length;
  const [lead] = product.trainers;
  const others = product.trainers.length - 1;

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
                <AppLink href={routes.packages} className="text-fg-muted no-underline hover:text-fg">
                  الباقات
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
              <span className="ma-tag ma-tag--green">باقة</span>
              {product.savings ? (
                <span className="ma-tag ma-tag--outline">وفّر {product.savings.percent}٪</span>
              ) : null}
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
            <ul aria-label="تفاصيل الباقة" className="m-0 mt-10 flex list-none flex-wrap gap-3 p-0">
              {facts.map(({ key, label }) => {
                const Icon = factIcon[key];
                return (
                  <li key={key} className="flex items-center gap-3 border border-line bg-surface px-4 py-3">
                    <Icon aria-hidden="true" className="size-6 shrink-0 text-accent" />
                    <span className="text-lg font-bold md:text-xl">{label}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </section>

      {shown.length > 0 ? (
        <div className="ma-container relative z-10">
          <div className="flex flex-wrap items-end gap-x-5 gap-y-3" style={{ marginTop: -AVATAR_SIZE / 2 }}>
            <ul aria-label="مدربو الباقة" className="m-0 flex list-none p-0">
              {shown.map((trainer, index) => (
                <li key={trainer.id} className={index > 0 ? "-ms-4" : undefined}>
                  <AppLink href={trainer.href} title={trainer.name} className="group block rounded-full">
                    <span className="sr-only">{trainer.name}</span>
                    <TrainerAvatar
                      trainer={trainer}
                      size={AVATAR_SIZE}
                      index={index}
                      className="ring-4 ring-surface transition-transform duration-200 group-hover:-translate-y-1 motion-reduce:transition-none"
                    />
                  </AppLink>
                </li>
              ))}
              {hidden > 0 ? (
                <li className="-ms-4">
                  <span
                    className="grid place-items-center rounded-full bg-surface-alt font-bold tabular-nums ring-4 ring-surface"
                    style={{ width: AVATAR_SIZE, height: AVATAR_SIZE }}
                  >
                    <span dir="ltr">+{hidden}</span>
                    <span className="sr-only">مدربين آخرين</span>
                  </span>
                </li>
              ) : null}
            </ul>
            <p className="m-0 flex flex-col pb-1">
              <span className="text-xs text-fg-muted">{others > 0 ? "المدربون" : "المدرب"}</span>
              <span className="font-bold">
                {lead?.name}
                {others > 0 ? ` و${formatCount(others, OTHER_TRAINER_FORMS)}` : null}
              </span>
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
