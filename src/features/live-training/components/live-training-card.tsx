import { CalendarDays, Clock, MonitorPlay } from "lucide-react";
import Image from "next/image";

import { AppLink } from "@/components/ui/app-link";
import { brandBg } from "@/components/ui/brand-colors";
import { cn } from "@/lib/cn";

import { livePageCopy } from "../content/copy";
import type { LiveTrainingVM } from "../model/types";

/**
 * One live training as a horizontal row card: a small thumbnail on one side, the content on the
 * other. The thumbnail shows the whole cover (`object-contain`), letterboxed on its brand colour, so
 * tall brochure covers are never cropped — just scaled down to fit.
 */
export function LiveTrainingCard({ training, priority = false }: { training: LiveTrainingVM; priority?: boolean }) {
  const meta = [
    { icon: CalendarDays, label: training.dateRange },
    { icon: Clock, label: training.sessionTime },
    { icon: MonitorPlay, label: training.location },
  ];

  return (
    <article className="ma-card group relative flex h-full flex-col focus-within:border-line-strong sm:flex-row">
      <div
        className={cn(
          "relative w-full shrink-0 overflow-hidden aspect-[4/3] sm:aspect-auto sm:h-40 sm:w-40 sm:self-center lg:h-44 lg:w-44",
          brandBg[training.color],
        )}
      >
        {training.coverImage ? (
          <Image
            src={training.coverImage}
            alt=""
            fill
            priority={priority}
            sizes="(min-width: 1024px) 176px, (min-width: 640px) 160px, 100vw"
            className="object-contain"
          />
        ) : null}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2 p-4 sm:p-5">
        <div className="flex flex-wrap gap-2">
          <span className="ma-tag ma-tag--coral">بث مباشر</span>
          {training.cohort ? <span className="ma-tag ma-tag--soft">{training.cohort}</span> : null}
        </div>
        <h2 className="ma-card__title m-0 line-clamp-2">
          <AppLink href={training.href} className="text-fg no-underline after:absolute after:inset-0 after:content-['']">
            {training.title}
          </AppLink>
        </h2>
        <p className="m-0 text-sm font-medium">{training.trainerName}</p>
        {training.subtitle ? <p className="m-0 line-clamp-2 text-sm leading-6 text-fg-muted">{training.subtitle}</p> : null}
        <ul className="ma-card__meta m-0 mt-auto list-none p-0">
          {meta.map(({ icon: Icon, label }) => (
            <li key={label} className="inline-flex items-center gap-1">
              <Icon aria-hidden="true" className="size-3.5 shrink-0 fill-none" strokeWidth={2} />
              {label}
            </li>
          ))}
        </ul>
        <div className="mt-3 flex items-center justify-between gap-4 border-t border-line pt-3">
          <span dir="ltr" className="text-lg font-bold tabular-nums">
            {training.price.current}
          </span>
          <span className="text-sm font-medium text-fg-muted transition-colors group-hover:text-fg">{livePageCopy.cardCta}</span>
        </div>
      </div>
    </article>
  );
}
