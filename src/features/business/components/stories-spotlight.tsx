"use client";

import { clsx as cn } from "clsx";
import { ArrowUpLeft, ChevronLeft, ChevronRight, Clock, Eye, Play } from "lucide-react";
import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";

import { brandBg, type BrandColor } from "@/components/ui/brand-colors";
import { SectionHeader } from "@/components/ui/section-header";

import type { StoryVM } from "../model/b2b-view";

const ROTATE_MS = 7000;

type CardState = "active" | "side" | "far" | "hidden";

const KIND_COLOR: Record<StoryVM["kind"], BrandColor> = {
  company_case: "yellow",
  video_review: "teal",
  graduate_review: "lilac",
  review: "coral",
};

/** Where a card sits relative to the active one: offset in stage-width units (cqw), scale, state. */
function placement(index: number, active: number, total: number): { slot: number; scale: number; state: CardState } {
  let delta = index - active;
  if (delta > total / 2) delta -= total;
  if (delta < -total / 2) delta += total;
  const distance = Math.abs(delta);
  if (distance === 0) return { slot: 0, scale: 1, state: "active" };
  if (distance === 1) return { slot: delta * 42, scale: 0.78, state: "side" };
  if (distance === 2) return { slot: delta * 70, scale: 0.58, state: "far" };
  return { slot: delta * 91, scale: 0.4, state: "hidden" };
}

const embedUrl = (id: string) =>
  `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;

function Dot() {
  return (
    <span aria-hidden="true" className="opacity-40">
      •
    </span>
  );
}

type StoriesSpotlightProps = {
  stories: StoryVM[];
  label: string;
  title: string;
  lead: string;
  note: string;
  watchLabel: string;
};

/**
 * "ماذا قال المتدربون؟": the same cinematic spotlight as the landing page's expert videos, fed by the
 * B2B success stories. The active video sits centre-stage with a brand-colour glow, neighbours recede
 * blurred; kind chips narrow the line-up; arrows, dots and a progress bar drive it. The YouTube player
 * mounts only in the dialog after a click.
 */
export function StoriesSpotlight({ stories, label, title, lead, note, watchLabel }: StoriesSpotlightProps) {
  const [active, setActive] = useState(0);
  const [focused, setFocused] = useState(false);
  const [inView, setInView] = useState(false);
  const [playing, setPlaying] = useState<StoryVM | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const dialogTitleId = useId();

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.25 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const listed = stories;
  const total = listed.length;

  if (total === 0) return null;

  const paused = focused || !inView || playing !== null;
  const current = listed[active];
  const goTo = (index: number) => setActive(((index % total) + total) % total);
  const next = () => goTo(active + 1);
  const prev = () => goTo(active - 1);

  const play = (story: StoryVM) => {
    if (!story.youtubeId) return;
    setPlaying(story);
    dialogRef.current?.showModal();
  };
  const close = () => dialogRef.current?.close();

  const onStageKeyDown = (event: KeyboardEvent) => {
    // Arabic reads right to left: the left arrow moves forward.
    if (event.key === "ArrowLeft") next();
    else if (event.key === "ArrowRight") prev();
    else if (event.key === "Home") goTo(0);
    else if (event.key === "End") goTo(total - 1);
    else return;
    event.preventDefault();
  };

  return (
    <section
      ref={sectionRef}
      id="stories"
      aria-labelledby={titleId}
      data-paused={paused}
      style={{ "--vs-duration": `${ROTATE_MS}ms` } as CSSProperties}
      className="ma-vs ma-section cv-auto"
      onFocus={(event) => setFocused(event.target.matches(":focus-visible"))}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}
    >
      <div className="ma-container">
        <SectionHeader id={titleId} label={label} title={title} lead={lead} />
      </div>

      <div
        role="region"
        aria-roledescription="carousel"
        aria-label="قصص نجاح وآراء متدربي ماستري. استخدم الأسهم للتنقل."
        className="ma-vs-stage mt-10 short:mt-4"
        onKeyDown={onStageKeyDown}
      >
        {listed.map((story, index) => {
          const { slot, scale, state } = placement(index, active, total);
          const isActive = state === "active";
          const color = KIND_COLOR[story.kind];
          return (
            <div
              key={story.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} من ${total}`}
              aria-hidden={!isActive}
              data-state={state}
              className="ma-vs-card"
              style={{ "--slot": slot, "--scale": scale, "--glow": `var(--${color})` } as CSSProperties}
            >
              <div className="ma-vs-card__glow" aria-hidden="true" />
              <button
                type="button"
                tabIndex={isActive ? 0 : -1}
                onClick={() => (isActive ? play(story) : goTo(index))}
                aria-haspopup={isActive && story.youtubeId ? "dialog" : undefined}
                aria-label={isActive ? `تشغيل: ${story.title}` : `عرض: ${story.title}`}
                className="ma-vs-card__inner"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- YouTube thumbnail; already a sized JPEG */}
                <img
                  src={story.thumbnail ?? ""}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="ma-vs-card__img"
                />
                <span aria-hidden="true" className="ma-vs-card__scrim" />
                <span className="ma-vs-card__top">
                  <span className="ma-vs-chip">{story.kindLabel}</span>
                  <span className={cn("ma-tag px-3 py-1.5 text-[13px] font-bold tracking-normal", `ma-tag--${color}`)}>
                    {story.course ?? "قصة نجاح"}
                  </span>
                </span>
                <span aria-hidden="true" className="ma-vs-card__play">
                  <Play />
                </span>
                <span className="ma-vs-card__bottom">
                  <span className="ma-vs-card__title">{story.title}</span>
                  {story.duration ? (
                    <span className="ma-vs-chip tabular-nums">
                      <Clock aria-hidden="true" />
                      {story.duration}
                    </span>
                  ) : null}
                </span>
              </button>
            </div>
          );
        })}
      </div>

      <div className="ma-container">
        <div aria-live={paused ? "polite" : "off"} className="mt-7 flex min-h-14 items-center justify-center">
          <div key={current.id} className="ma-vs-caption flex items-center gap-3.5 max-sm:flex-col max-sm:text-center">
            <span aria-hidden="true" className={cn("ma-avatar size-11 text-base", brandBg[KIND_COLOR[current.kind]])}>
              {current.kindLabel.charAt(0)}
            </span>
            <div className="flex flex-col gap-1 max-sm:items-center">
              <p className="m-0 text-[clamp(1rem,1.8vw,1.25rem)] leading-snug font-semibold">{current.title}</p>
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px] text-fg-muted max-sm:justify-center">
                <span>{current.kindLabel}</span>
                {current.course ? (
                  <>
                    <Dot />
                    <span>{current.course}</span>
                  </>
                ) : null}
                {current.views ? (
                  <>
                    <Dot />
                    <span className="inline-flex items-center gap-1.5 tabular-nums">
                      <Eye aria-hidden="true" className="size-3.5 opacity-70" />
                      <span className="sr-only">المشاهدات:</span>
                      {current.views.toLocaleString("en-US")}
                    </span>
                  </>
                ) : null}
                {current.videoUrl ? (
                  <>
                    <Dot />
                    <a
                      href={current.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 border-b-2 border-accent pb-0.5 font-semibold text-accent transition-opacity hover:opacity-75"
                    >
                      {watchLabel}
                      <ArrowUpLeft aria-hidden="true" className="size-3.5" />
                    </a>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-4 md:gap-6">
          <button type="button" onClick={prev} aria-label="القصة السابقة" className="ma-btn ma-btn--soft ma-btn--icon rounded-full">
            <ChevronRight aria-hidden="true" />
          </button>
          <div className="flex max-w-90 flex-1 flex-col items-center gap-3">
            <div className="flex flex-wrap items-center justify-center gap-2">
              {listed.map((story, index) => (
                <button
                  key={story.id}
                  type="button"
                  onClick={() => goTo(index)}
                  aria-label={`عرض: ${story.title}`}
                  aria-current={index === active}
                  className={cn(
                    "h-2 rounded-full transition-all motion-reduce:transition-none",
                    index === active ? "w-7 bg-coral" : "w-2 bg-line-strong opacity-40 hover:opacity-70",
                  )}
                />
              ))}
            </div>
            <div className="ma-vs-progress" aria-hidden="true">
              <div key={active} className="ma-vs-progress__bar" onAnimationEnd={next} />
            </div>
          </div>
          <button type="button" onClick={next} aria-label="القصة التالية" className="ma-btn ma-btn--soft ma-btn--icon rounded-full">
            <ChevronLeft aria-hidden="true" />
          </button>
        </div>

        <p className="b2b-section-note mt-6 text-center">{note}</p>
      </div>

      <dialog
        ref={dialogRef}
        onClose={() => setPlaying(null)}
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
        aria-labelledby={dialogTitleId}
        className="m-auto w-[min(60rem,calc(100vw-2rem))] max-w-none overflow-hidden rounded-panel border border-line bg-surface p-0 text-fg backdrop:bg-ink/85 backdrop:backdrop-blur-sm"
      >
        <h2 id={dialogTitleId} className="sr-only">
          {playing?.title ?? title}
        </h2>
        <div className="relative aspect-video bg-ink">
          {playing?.youtubeId ? (
            <iframe
              src={embedUrl(playing.youtubeId)}
              title={playing.title}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              className="absolute inset-0 block size-full border-0"
            />
          ) : null}
        </div>
      </dialog>
    </section>
  );
}

