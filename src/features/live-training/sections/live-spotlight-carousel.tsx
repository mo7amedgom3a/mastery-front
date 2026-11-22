"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";

import { CarouselDots } from "@/components/ui/carousel-dots";
import { PauseButton } from "@/components/ui/pause-button";
import { cn } from "@/lib/cn";

import type { LiveTrainingVM } from "../model/types";
import { SpotlightInner } from "./live-spotlight";

const ROTATE_MS = 6000;
/** Horizontal travel (px) a touch must cover to count as a swipe rather than a tap or scroll. */
const SWIPE_PX = 48;

/**
 * The landing spotlight as a crossfading carousel over the featured live diplomas (CMTD + AI …).
 * Each diploma keeps its own storefront `style` (brand-colour field). Auto-advances unless the
 * visitor prefers reduced motion, pauses while hovered or focused, and has an explicit pause/resume
 * control; the dots skip straight to a slide. Inactive slides are inert, so hidden CTAs never enter
 * the tab order. Prev/next arrows, the keyboard arrows and a touch swipe step through the slides.
 * Follows the site theme (dark or light) rather than forcing dark.
 */
export function LiveSpotlightCarousel({ trainings }: { trainings: LiveTrainingVM[] }) {
  const [active, setActive] = useState(0);
  const [userPaused, setUserPaused] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const paused = userPaused || interacting;

  // Below the fold on most screens: don't schedule a state update every 6 s until it is in view.
  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.15 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (trainings.length < 2 || paused || !visible) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const id = window.setInterval(() => setActive((current) => (current + 1) % trainings.length), ROTATE_MS);
    return () => window.clearInterval(id);
  }, [trainings.length, paused, visible]);

  const touchStartX = useRef<number | null>(null);
  const count = trainings.length;
  const step = (delta: number) => setActive((current) => ((current < count ? current : 0) + delta + count) % count);
  const goPrev = () => step(-1);
  const goNext = () => step(1);

  // RTL page: the "next" slide sits to the left, so ArrowLeft advances and ArrowRight goes back.
  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (count < 2 || event.defaultPrevented) return;
    const target = event.target as HTMLElement;
    if (target.closest("input, textarea, select, [contenteditable='true'], [role='dialog']")) return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goNext();
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      goPrev();
    }
  };

  const togglePaused = () => {
    const next = !userPaused;
    setUserPaused(next);
    // Pressing play while the pointer/keyboard focus is still over the section must really resume:
    // drop the incidental interaction pause until the visitor leaves and re-enters.
    if (!next) setInteracting(false);
  };

  if (trainings.length === 0) return null;
  const activeIndex = active < trainings.length ? active : 0;

  return (
    <section
      ref={sectionRef}
      id="live"
      aria-roledescription="carousel"
      aria-label="دورات البث المباشر"
      data-landing-surface="alt"
      className="relative isolate overflow-hidden bg-surface-alt text-fg transition-colors cv-auto [contain-intrinsic-size:auto_1250px] md:[contain-intrinsic-size:auto_760px]"
      onMouseEnter={() => setInteracting(true)}
      onMouseLeave={() => setInteracting(false)}
      onFocus={(event) => {
        // The play button (and any other carousel control) must not re-pause what it just resumed.
        if ((event.target as HTMLElement).closest("[data-carousel-control]")) return;
        setInteracting(true);
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setInteracting(false);
      }}
      onKeyDown={onKeyDown}
      onTouchStart={(event) => {
        touchStartX.current = event.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(event) => {
        const start = touchStartX.current;
        touchStartX.current = null;
        const end = event.changedTouches[0]?.clientX;
        if (start == null || end == null || count < 2) return;
        const dx = end - start;
        if (Math.abs(dx) < SWIPE_PX) return;
        // RTL: swiping right-to-left (dx < 0) pulls in the next slide from the left.
        if (dx < 0) goNext();
        else goPrev();
      }}
    >
      <div id="live-spotlight-slides" aria-live={paused ? "polite" : "off"} className="relative">
        {trainings.map((training, index) => (
          <div
            key={training.catalogSlug}
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} من ${trainings.length}`}
            aria-hidden={index !== activeIndex}
            inert={index !== activeIndex}
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
        <div className="ma-container relative z-10 flex items-center gap-2 pb-4">
          <button
            type="button"
            onClick={goPrev}
            aria-label="الدورة السابقة"
            aria-controls="live-spotlight-slides"
            className="ma-btn ma-btn--soft ma-btn--icon size-11 min-h-11 shrink-0 rounded-full"
          >
            <ChevronRight aria-hidden="true" className="size-5" />
          </button>
          <CarouselDots
            items={trainings.map((training) => ({ key: training.catalogSlug, label: training.title }))}
            activeIndex={activeIndex}
            onChange={setActive}
            label="شرائح دورات البث المباشر"
          />
          <button
            type="button"
            onClick={goNext}
            aria-label="الدورة التالية"
            aria-controls="live-spotlight-slides"
            className="ma-btn ma-btn--soft ma-btn--icon size-11 min-h-11 shrink-0 rounded-full"
          >
            <ChevronLeft aria-hidden="true" className="size-5" />
          </button>
          <PauseButton paused={userPaused} onToggle={togglePaused} />
        </div>
      ) : null}
    </section>
  );
}
