"use client";

import { clsx as cn } from "clsx";
import { ArrowUpLeft, Clock, Play, X } from "lucide-react";
import { useId, useRef, useState, type MouseEvent } from "react";

import type { TestimonialVideo } from "../content/testimonial-videos";

// `oar2` is YouTube's portrait (9:16) frame for Shorts; outside the image optimizer's hosts.
const posterUrl = (id: string) => `https://i.ytimg.com/vi/${encodeURIComponent(id)}/oar2.jpg`;
const watchUrl = (id: string) => `https://www.youtube.com/shorts/${encodeURIComponent(id)}`;
const embedUrl = (id: string) =>
  `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;

/**
 * A learner-feedback reel in the testimonials marquee: a portrait poster that opens a vertical
 * player. The iframe exists only while the dialog is open, so nothing from YouTube but the poster
 * loads before the click, and closing (button, Esc, backdrop) stops playback. The dialog lives in
 * the marquee item, so focus inside it keeps the row paused (`:focus-within`) while it plays.
 */
export function TestimonialReelCard({ video }: { video: TestimonialVideo }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const openedByPointer = useRef(false);
  const [open, setOpen] = useState(false);
  const titleId = useId();

  const show = (event: MouseEvent<HTMLButtonElement>) => {
    // `detail` is 0 when Enter/Space activated the button, ≥ 1 for a real click or tap.
    openedByPointer.current = event.detail > 0;
    setOpen(true);
    dialogRef.current?.showModal();
  };
  const close = () => dialogRef.current?.close();

  // The dialog hands focus back to this button on close. That keeps the marquee paused through
  // `:focus-within`, so after a mouse/touch session drop the focus and let the row move again.
  // Keyboard users keep focus on the button (and the row stays paused until they tab away).
  const onClose = () => {
    setOpen(false);
    if (openedByPointer.current) {
      requestAnimationFrame(() => {
        if (document.activeElement === triggerRef.current) triggerRef.current?.blur();
      });
    }
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={show}
        aria-haspopup="dialog"
        aria-label={`تشغيل فيديو: ${video.title} (${video.program})`}
        className="group relative block h-full min-h-[22rem] w-52 overflow-hidden rounded-panel bg-ink text-start text-white sm:min-h-[26rem] sm:w-60"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={posterUrl(video.youtubeId)}
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute inset-0 size-full object-cover transition-transform duration-500 ease-out group-hover:scale-105 motion-reduce:transition-none"
        />
        <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-ink/40" />
        <span className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          <span className={cn("ma-tag px-2.5 py-1 text-xs font-bold tracking-normal text-ink", `ma-tag--${video.color}`)}>
            {video.program}
          </span>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-ink/70 px-2 py-1 text-xs tabular-nums backdrop-blur-sm">
            <Clock aria-hidden="true" className="size-3" />
            <span dir="ltr">{video.duration}</span>
          </span>
        </span>
        <span
          aria-hidden="true"
          className="absolute top-1/2 left-1/2 grid size-14 -translate-x-1/2 -translate-y-1/2 place-content-center rounded-full bg-accent text-ink transition-transform duration-200 ease-out group-hover:scale-110 motion-reduce:transition-none"
        >
          <Play className="ms-1 size-6 fill-current" />
        </span>
        <span className="absolute inset-x-4 bottom-4 text-base leading-snug font-bold">{video.title}</span>
      </button>

      <dialog
        ref={dialogRef}
        onClose={onClose}
        onClick={(event) => {
          // Click on the backdrop (the dialog element itself) closes it.
          if (event.target === event.currentTarget) close();
        }}
        aria-labelledby={titleId}
        className="m-auto w-[min(24rem,calc(100vw-2rem),calc((100svh-9rem)*9/16))] max-w-none overflow-hidden rounded-panel border border-line bg-surface p-0 text-fg backdrop:bg-ink/85"
      >
        <div className="relative aspect-[9/16] bg-ink">
          {open ? (
            <iframe
              src={embedUrl(video.youtubeId)}
              title={video.title}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              className="absolute inset-0 block size-full border-0"
            />
          ) : null}
        </div>
        <div className="flex items-start justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 flex-col gap-1">
            <h3 id={titleId} className="m-0 text-base leading-snug font-semibold">
              {video.title}
            </h3>
            <a
              href={watchUrl(video.youtubeId)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm font-semibold text-accent hover:opacity-75"
            >
              {video.program} · شاهد على يوتيوب
              <ArrowUpLeft aria-hidden="true" className="size-3.5" />
            </a>
          </div>
          <button type="button" onClick={close} aria-label="إغلاق الفيديو" className="ma-btn ma-btn--soft ma-btn--icon size-11 min-h-11 shrink-0 rounded-full">
            <X aria-hidden="true" className="size-5" />
          </button>
        </div>
      </dialog>
    </>
  );
}
