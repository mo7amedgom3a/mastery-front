"use client";

import { clsx as cn } from "clsx";
import { ArrowUpLeft, ChevronLeft, ChevronRight, Clock, Eye, Mic, Play, ThumbsUp, X } from "lucide-react";
import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";

import { brandBg } from "@/components/ui/brand-colors";
import { SectionHeader } from "@/components/ui/section-header";

import { expertVideos, type ExpertVideo } from "../content/expert-videos";

const ROTATE_MS = 7000;

type CardState = "active" | "side" | "far" | "hidden";

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

/** First letter of the name, skipping honorifics like "د." */
function initialOf(name: string): string {
  return name.replace(/^د\.\s*/, "").trim().charAt(0);
}

const thumbnailUrl = (id: string) => `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`;
const watchUrl = (id: string) => `https://www.youtube.com/watch?v=${id}`;
const embedUrl = (id: string) =>
  `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;

/**
 * Cinematic spotlight of interviews and podcasts featuring Mastery experts: the active video sits
 * centre-stage with a brand-colour glow, neighbours recede blurred to either side. Auto-advances
 * when the progress bar fills (so pausing the bar pauses the carousel). Hovering does not pause it;
 * keyboard focus, being offscreen or a playing video does, and it never runs under reduced motion.
 * The YouTube player loads only inside the dialog, after the click.
 */
export function ExpertVideosSection() {
  const total = expertVideos.length;
  const [active, setActive] = useState(0);
  const [focused, setFocused] = useState(false);
  const [inView, setInView] = useState(false);
  const [playing, setPlaying] = useState<ExpertVideo | null>(null);
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

  if (total === 0) return null;

  const paused = focused || !inView || playing !== null;
  const current = expertVideos[active];
  const goTo = (index: number) => setActive(((index % total) + total) % total);
  const next = () => goTo(active + 1);
  const prev = () => goTo(active - 1);

  const play = (video: ExpertVideo) => {
    setPlaying(video);
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
      id="expert-videos"
      aria-labelledby={titleId}
      data-paused={paused}
      style={{ "--vs-duration": `${ROTATE_MS}ms` } as CSSProperties}
      className="ma-vs ma-section ma-band cv-auto"
      // Only keyboard focus pauses: a mouse click on an arrow or dot must not stop the rotation.
      onFocus={(event) => setFocused(event.target.matches(":focus-visible"))}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}
    >
      <div className="ma-container">
        <SectionHeader
          id={titleId}
          label="خبراؤنا على الشاشة"
          title="حلقات مختارة من ضيوف ماستري أكاديمي"
          lead="محادثات حقيقية مع المدربين والخبراء الذين يقودون في الميدان — قيادة وتسويق وموارد بشرية وتطوير ذات. اختر حلقة، اضغط تشغيل، وشاهد المقابلة كاملة."
        />
      </div>

      <div
        role="region"
        aria-roledescription="carousel"
        aria-label="حلقات خبراء ماستري. استخدم الأسهم للتنقل بين الحلقات."
        className="ma-vs-stage mt-12 short:mt-6"
        onKeyDown={onStageKeyDown}
      >
        {expertVideos.map((video, index) => {
          const { slot, scale, state } = placement(index, active, total);
          const isActive = state === "active";
          return (
            <div
              key={video.youtubeId}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} من ${total}`}
              aria-hidden={!isActive}
              data-state={state}
              className="ma-vs-card"
              style={{ "--slot": slot, "--scale": scale, "--glow": `var(--${video.color})` } as CSSProperties}
            >
              <div className="ma-vs-card__glow" aria-hidden="true" />
              <button
                type="button"
                tabIndex={isActive ? 0 : -1}
                onClick={() => (isActive ? play(video) : goTo(index))}
                aria-haspopup={isActive ? "dialog" : undefined}
                aria-label={isActive ? `تشغيل: ${video.title}` : `عرض: ${video.title}`}
                className="ma-vs-card__inner"
              >
                {/* YouTube thumbnails: outside the image optimizer's hosts, and already sized JPEGs. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={thumbnailUrl(video.youtubeId)} alt="" loading="lazy" decoding="async" className="ma-vs-card__img" />
                <span className="ma-vs-card__scrim" aria-hidden="true" />
                <span className="ma-vs-card__top">
                  <span className="ma-vs-chip">
                    <Mic aria-hidden="true" />
                    {video.show}
                  </span>
                  <span className={cn("ma-tag px-3 py-1.5 text-[13px] font-bold tracking-normal", `ma-tag--${video.color}`)}>{video.category}</span>
                </span>
                <span className="ma-vs-card__play" aria-hidden="true">
                  <Play />
                </span>
                <span className="ma-vs-card__bottom">
                  <span className="ma-vs-card__title">{video.title}</span>
                  <span className="ma-vs-chip tabular-nums">
                    <Clock aria-hidden="true" />
                    {video.duration}
                  </span>
                </span>
              </button>
            </div>
          );
        })}
      </div>

      <div className="ma-container">
        {/* Announced only while the visitor is in control, not on every automatic turn. */}
        <div aria-live={paused ? "polite" : "off"} className="mt-7 flex min-h-14 items-center justify-center">
          <div key={current.youtubeId} className="ma-vs-caption flex items-center gap-3.5 max-sm:flex-col max-sm:text-center">
            <span aria-hidden="true" className={cn("ma-avatar size-11 text-base", brandBg[current.color])}>
              {initialOf(current.host)}
            </span>
            <div className="flex flex-col gap-1 max-sm:items-center">
              <p className="m-0 text-[clamp(1rem,1.8vw,1.25rem)] leading-snug font-semibold">{current.title}</p>
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px] text-fg-muted max-sm:justify-center">
                <span>{current.host}</span>
                <Dot />
                <span>{current.role}</span>
                <Dot />
                <span className="inline-flex items-center gap-1.5 tabular-nums">
                  <Eye aria-hidden="true" className="size-3.5 opacity-70" />
                  <span className="sr-only">المشاهدات:</span>
                  {current.views}
                </span>
                <Dot />
                <span className="inline-flex items-center gap-1.5 tabular-nums">
                  <ThumbsUp aria-hidden="true" className="size-3.5 opacity-70" />
                  <span className="sr-only">الإعجابات:</span>
                  {current.likes}
                </span>
                <Dot />
                <a
                  href={watchUrl(current.youtubeId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 border-b-2 border-accent pb-0.5 font-semibold text-accent transition-opacity hover:opacity-75"
                >
                  شاهد على يوتيوب
                  <ArrowUpLeft aria-hidden="true" className="size-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-4 md:gap-6">
          <button type="button" onClick={prev} aria-label="الحلقة السابقة" className="ma-btn ma-btn--soft ma-btn--icon rounded-full">
            <ChevronRight aria-hidden="true" />
          </button>
          <div className="flex max-w-90 flex-1 flex-col items-center gap-3">
            <div className="flex items-center gap-2">
              {expertVideos.map((video, index) => (
                <button
                  key={video.youtubeId}
                  type="button"
                  onClick={() => goTo(index)}
                  aria-label={`عرض: ${video.title}`}
                  aria-current={index === active}
                  className={cn(
                    "h-2 rounded-full transition-all motion-reduce:transition-none",
                    index === active ? "w-7 bg-coral" : "w-2 bg-line-strong opacity-40 hover:opacity-70",
                  )}
                />
              ))}
            </div>
            <div className="ma-vs-progress" aria-hidden="true">
              {/* Keyed by slide so the bar restarts on every change; its end turns to the next one. */}
              <div key={active} className="ma-vs-progress__bar" onAnimationEnd={next} />
            </div>
          </div>
          <button type="button" onClick={next} aria-label="الحلقة التالية" className="ma-btn ma-btn--soft ma-btn--icon rounded-full">
            <ChevronLeft aria-hidden="true" />
          </button>
        </div>
      </div>

      <dialog
        ref={dialogRef}
        onClose={() => setPlaying(null)}
        onClick={(event) => {
          // Click on the backdrop (the dialog element itself) closes it.
          if (event.target === event.currentTarget) close();
        }}
        aria-labelledby={dialogTitleId}
        className="m-auto w-[min(60rem,calc(100vw-2rem))] max-w-none overflow-hidden rounded-panel border border-line bg-surface p-0 text-fg backdrop:bg-ink/85 backdrop:backdrop-blur-sm"
      >
        <div className="relative aspect-video bg-ink">
          {playing ? (
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
        <div className="flex items-start justify-between gap-4 px-5 py-4">
          <div className="flex flex-col gap-1">
            <h3 id={dialogTitleId} className="m-0 text-[clamp(0.95rem,1.6vw,1.125rem)] leading-snug font-semibold">
              {playing?.title}
            </h3>
            <p className="m-0 text-[13px] text-fg-muted">
              {playing?.show} · {playing?.host}
            </p>
          </div>
          <button type="button" onClick={close} aria-label="إغلاق الفيديو" className="ma-btn ma-btn--soft ma-btn--icon size-11 min-h-11 rounded-full">
            <X aria-hidden="true" className="size-5" />
          </button>
        </div>
      </dialog>
    </section>
  );
}

function Dot() {
  return <span aria-hidden="true" className="size-[3px] rounded-full bg-current opacity-50" />;
}
