"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/cn";

import type { LiveTrainingVM } from "../model/types";
import { SpotlightInner } from "./live-spotlight";

const ROTATE_MS = 6000;

/**
 * The landing spotlight as a crossfading carousel over the featured live diplomas (CMTD + AI …).
 * Each diploma keeps its own storefront `style` (brand-colour field). Auto-advances unless the
 * visitor prefers reduced motion; pauses while hovered or focused; the dots skip straight to a slide.
 */
export function LiveSpotlightCarousel({ trainings }: { trainings: LiveTrainingVM[] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (trainings.length < 2 || paused) return;
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const id = window.setInterval(() => setActive((current) => (current + 1) % trainings.length), ROTATE_MS);
    return () => window.clearInterval(id);
  }, [trainings.length, paused]);

  if (trainings.length === 0) return null;
  const activeIndex = active < trainings.length ? active : 0;

  return (
    <section
      id="live"
      aria-roledescription="carousel"
      aria-label="دورات البث المباشر"
      data-theme="dark"
      className="relative isolate overflow-hidden bg-surface-alt text-fg cv-auto [contain-intrinsic-size:auto_1250px] md:[contain-intrinsic-size:auto_760px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="relative">
        {trainings.map((training, index) => (
          <div
            key={training.catalogSlug}
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} من ${trainings.length}`}
            aria-hidden={index !== activeIndex}
            className={cn(
              "transition-opacity duration-700 ease-out motion-reduce:transition-none",
              index === activeIndex ? "relative opacity-100" : "pointer-events-none absolute inset-0 opacity-0",
            )}
          >
            <SpotlightInner training={training} variant="landing" titleId={`live-spotlight-title-${index}`} />
          </div>
        ))}
      </div>

      {trainings.length > 1 ? (
        <div className="ma-container relative z-10 flex items-center gap-2 pb-6">
          {trainings.map((training, index) => (
            <button
              key={training.catalogSlug}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`عرض: ${training.title}`}
              aria-current={index === activeIndex}
              className={cn(
                "h-2 rounded-full transition-all motion-reduce:transition-none",
                index === activeIndex ? "w-8 bg-coral" : "w-2 bg-line-strong hover:bg-fg-muted",
              )}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
