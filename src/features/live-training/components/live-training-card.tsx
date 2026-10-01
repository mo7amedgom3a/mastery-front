import { CalendarDays, Clock, MonitorPlay } from "lucide-react";
import Image from "next/image";

import { AppLink } from "@/components/ui/app-link";
import { brandBg } from "@/components/ui/brand-colors";
import { cn } from "@/lib/cn";

import { livePageCopy } from "../content/copy";
import type { LiveTrainingVM } from "../model/types";

/**
 * Kit `.ma-card` for one live training, linking to its page. Same anatomy as `ProductCard`, with the
 * trainer and live schedule in place of the catalog meta. The title link stretches over the card.
 */
export function LiveTrainingCard({ training, priority = false }: { training: LiveTrainingVM; priority?: boolean }) {
  const meta = [
    { icon: CalendarDays, label: training.dateRange },
    { icon: Clock, label: training.sessionTime },
    { icon: MonitorPlay, label: training.location },
  ];

  return (
    <article className="ma-card group relative h-full focus-within:border-line-strong">
      <div className={cn("ma-card__media relative aspect-video overflow-hidden p-0", brandBg[training.color])}>
        {training.coverImage ? (
          <Image
            src={training.coverImage}
            alt=""
            fill
            priority={priority}
            sizes="(min-width: 1200px) 580px, (min-width: 600px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transition-none"
          />
        ) : null}
      </div>

      <div className="ma-card__body">
        <div className="flex flex-wrap gap-2">
          <span className="ma-tag ma-tag--coral">بث مباشر</span>
          {training.cohort ? <span className="ma-tag ma-tag--outline">{training.cohort}</span> : null}
        </div>
        <h2 className="ma-card__title line-clamp-2">
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
      </div>

      <div className="ma-card__foot">
        <span dir="ltr" className="text-lg font-bold tabular-nums">
          {training.price.current}
        </span>
        <span className="text-sm font-medium text-fg-muted transition-colors group-hover:text-fg">{livePageCopy.cardCta}</span>
      </div>
    </article>
  );
}
