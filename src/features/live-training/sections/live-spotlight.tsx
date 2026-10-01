import { ArrowLeft, Award, CalendarDays, Clock, MonitorPlay } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";

import { AppLink } from "@/components/ui/app-link";
import { brandBg } from "@/components/ui/brand-colors";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";

import { TrailerButton } from "../components/trailer-button";
import { spotlightCopy } from "../content/copy";
import type { LiveTrainingVM } from "../model/types";

type LiveSpotlightProps = {
  training: LiveTrainingVM | null;
  /**
   * `landing`: an h2 banner whose primary CTA opens the training's page. `detail`: the page's own
   * hero (h1); the booking card beside the content carries the primary CTA, so this one has none.
   */
  variant?: "landing" | "detail";
  /** Extra actions beside the trailer button (e.g. the brochure on the detail page). */
  actions?: ReactNode;
};

/**
 * Cinematic spotlight for a live training (MasterClass-style banner), kept flat per the kit: a
 * black band, the trainer's cutout standing on one solid brand-colour field, poster-scale type.
 * Forced dark (`data-theme`) in both site themes, so every role token resolves to its dark value.
 * Server-rendered; only the trailer button ships JS.
 */
export function LiveSpotlight({ training, variant = "landing", actions }: LiveSpotlightProps) {
  if (!training) {
    return null;
  }
  const isLanding = variant === "landing";
  const Heading = isLanding ? "h2" : "h1";

  const facts = [
    { icon: CalendarDays, label: training.sessions ? `${training.dateRange} · ${training.sessions}` : training.dateRange },
    { icon: Clock, label: training.sessionTime },
    { icon: MonitorPlay, label: training.location },
    ...(training.certificate ? [{ icon: Award, label: training.certificate }] : []),
  ];

  return (
    <section
      id={isLanding ? "live" : undefined}
      aria-labelledby="live-spotlight-title"
      data-theme="dark"
      className={cn(
        "relative isolate overflow-hidden bg-surface-alt text-fg",
        // Below the hero on the landing page: skip its style/layout/paint until it nears the viewport.
        isLanding && "cv-auto [contain-intrinsic-size:auto_1250px] md:[contain-intrinsic-size:auto_760px]",
      )}
    >
      <div className="ma-container grid items-end gap-10 pt-12 md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] md:gap-12 md:pt-20">
        <div className="flex flex-col items-start pb-12 md:pb-20">
          <div className="ma-cluster">
            <span className="ma-tag ma-tag--coral gap-2">
              <span aria-hidden="true" className="size-2 animate-pulse bg-ink motion-reduce:animate-none" />
              {spotlightCopy.live}
            </span>
            <span className="ma-tag ma-tag--outline">
              {training.cohort ? `${spotlightCopy.isNew} · ${training.cohort}` : spotlightCopy.isNew}
            </span>
          </div>

          {isLanding ? <p className="m-0 mt-6 text-base font-medium text-fg-muted">{spotlightCopy.headline}</p> : null}
          <Heading id="live-spotlight-title" className={cn("t-hero m-0", isLanding ? "mt-3" : "mt-6")}>
            {training.title}
          </Heading>
          {training.titleEn ? (
            <p dir="ltr" lang="en" className="m-0 mt-2 font-[family-name:var(--font-raleway)] text-sm font-bold tracking-[0.2em] text-coral uppercase">
              {training.titleEn}
            </p>
          ) : null}
          {training.subtitle ? <p className="t-lead m-0 mt-6 max-w-[34rem]">{training.subtitle}</p> : null}

          <p className="m-0 mt-6 text-base">
            {spotlightCopy.ledBy} <strong className="font-bold">{training.trainerName}</strong>
            {training.trainerTitle ? <span className="text-fg-muted"> · {training.trainerTitle}</span> : null}
          </p>

          <ul className="m-0 mt-8 grid w-full list-none gap-x-6 gap-y-3 border-t border-line p-0 pt-6 text-sm sm:grid-cols-2">
            {facts.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-start gap-2">
                <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-coral" />
                <span>{label}</span>
              </li>
            ))}
          </ul>

          {training.price.current ? (
            <p className="m-0 mt-8 flex flex-wrap items-baseline gap-x-3 tabular-nums">
              <span dir="ltr" className="text-3xl font-bold">
                {training.price.current}
              </span>
              {training.priceSar ? (
                <span className="text-sm text-fg-muted">
                  أو {formatNumber(training.priceSar)} {spotlightCopy.sar}
                </span>
              ) : null}
            </p>
          ) : null}

          <div className="ma-cluster mt-6">
            {isLanding ? (
              <ButtonLink href={training.href} variant="primary" size="lg">
                {spotlightCopy.details}
              </ButtonLink>
            ) : null}
            {training.trailerEmbedUrl ? (
              <TrailerButton
                embedUrl={training.trailerEmbedUrl}
                title={training.title}
                label={spotlightCopy.trailer}
                dialogLabel={spotlightCopy.trailerDialog}
              />
            ) : null}
            {actions}
          </div>

          {isLanding ? (
            <AppLink href={spotlightCopy.viewAll.href} className="ma-link mt-8 inline-flex min-h-11 items-center gap-2 text-sm font-medium">
              {spotlightCopy.viewAll.label}
              <ArrowLeft aria-hidden="true" className="ma-icon-dir size-4" />
            </AppLink>
          ) : null}
        </div>

        {training.heroImage ? (
          <div aria-hidden="true" className="relative order-first h-[24rem] sm:h-[30rem] md:order-none md:h-[40rem]">
            {/* Watermark: the programme name, set huge in the poster face behind the trainer. */}
            {training.titleEn ? (
              <span
                dir="ltr"
                className="t-poster absolute inset-x-0 top-0 text-center text-[clamp(4rem,11vw,9rem)] leading-[0.85] text-line select-none"
              >
                {training.titleEn}
              </span>
            ) : null}
            {/* Depth: an outlined frame offset behind the solid colour field, both flat. */}
            <div className="absolute inset-x-[16%] bottom-0 h-[72%] translate-x-4 -translate-y-4 border border-line-strong" />
            <div className={cn("absolute inset-x-[16%] bottom-0 h-[72%]", brandBg[training.color])} />
            {/* The cutout is portrait (≈0.6:1) and `object-contain`, so its width follows the frame's
                height (24/30/40rem), not the column: size the request to that, not to the column. */}
            <Image
              src={training.heroImage}
              alt=""
              fill
              sizes="(min-width: 900px) 380px, (min-width: 600px) 290px, 230px"
              loading={isLanding ? "lazy" : "eager"}
              fetchPriority={isLanding ? "low" : "high"}
              className="object-contain object-bottom"
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}
