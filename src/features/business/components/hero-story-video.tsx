"use client";

import { Play, X } from "lucide-react";
import { useRef, useState, type MouseEvent } from "react";

const embedUrl = (id: string) =>
  `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;

/** `maxresdefault` is missing on a few uploads; the smaller file always exists. */
const thumbnail = (id: string, size: "maxresdefault" | "hqdefault") => `https://i.ytimg.com/vi/${id}/${size}.jpg`;

type HeroStoryVideoProps = {
  youtubeId: string;
  /** Overlay caption (the story's title). */
  title: string;
  eyebrow: string;
  /** Runtime as YouTube shows it, e.g. "2:30". */
  duration: string;
  steps: readonly { label: string; detail?: string }[];
};

/**
 * The business hero's success-story card: a real customer video behind a play button, with the
 * training path ("احتياج → محتوى → تطبيق → قياس") as a four-step strip underneath.
 * The YouTube player is only mounted inside the dialog after a click, so the page ships no iframe.
 */
export function HeroStoryVideo({ youtubeId, title, eyebrow, duration, steps }: HeroStoryVideoProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [playing, setPlaying] = useState(false);
  const [source, setSource] = useState(() => thumbnail(youtubeId, "maxresdefault"));

  const play = () => {
    setPlaying(true);
    dialogRef.current?.showModal();
  };
  const close = () => dialogRef.current?.close();
  const onBackdrop = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget) close();
  };

  return (
    <div className="b2b-hero__visual" data-b2b-hero-art>
      {/* Glow sampled from the thumbnail's warm palette, so the card sits in its own light. */}
      <span aria-hidden="true" className="b2b-hero__glow" />
      <button
        type="button"
        onClick={play}
        className="b2b-hero__video"
        aria-haspopup="dialog"
        aria-label={`تشغيل قصة النجاح: ${title}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- YouTube thumbnail; the optimizer adds nothing */}
        <img
          src={source}
          onError={() => setSource(thumbnail(youtubeId, "hqdefault"))}
          alt=""
          loading="eager"
          decoding="async"
          className="b2b-hero__video-img"
        />
        <span aria-hidden="true" className="b2b-hero__video-scrim" />
        <span className="b2b-hero__video-top">
          <span className="b2b-hero__video-chip">{eyebrow}</span>
          <span dir="ltr" className="b2b-hero__video-time">
            {duration}
          </span>
        </span>
        <span aria-hidden="true" className="b2b-hero__video-play">
          <Play className="size-7 fill-current" />
        </span>
        <span className="b2b-hero__video-title">{title}</span>
      </button>

      <ol className="b2b-hero__flow" aria-label="رحلة التدريب">
        {steps.map((step, index) => (
          <li key={step.label} className="b2b-hero__flow-step">
            <span className="b2b-hero__flow-num" aria-hidden="true">
              0{index + 1}
            </span>
            <span className="b2b-hero__flow-label">{step.label}</span>
            {step.detail ? <span className="b2b-hero__flow-detail">{step.detail}</span> : null}
          </li>
        ))}
      </ol>

      <dialog
        ref={dialogRef}
        onClose={() => setPlaying(false)}
        onClick={onBackdrop}
        aria-label={title}
        className="m-auto w-[min(60rem,calc(100vw-2rem))] max-w-none overflow-hidden rounded-panel border border-line bg-ink p-0 text-white backdrop:bg-ink/85 backdrop:backdrop-blur-sm"
      >
        <div className="relative aspect-video bg-ink">
          <button
            type="button"
            onClick={close}
            aria-label="إغلاق الفيديو"
            className="absolute z-10 grid size-10 place-items-center rounded-full bg-ink/70 text-white backdrop-blur-sm transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            style={{ insetBlockStart: "0.75rem", insetInlineEnd: "0.75rem" }}
          >
            <X aria-hidden="true" className="size-5" />
          </button>
          {playing ? (
            <iframe
              src={embedUrl(youtubeId)}
              title={title}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              className="absolute inset-0 block size-full border-0"
            />
          ) : null}
        </div>
      </dialog>
    </div>
  );
}
