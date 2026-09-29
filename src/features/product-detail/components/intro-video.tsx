"use client";

import { Play } from "lucide-react";
import { useState, type ReactNode } from "react";

type IntroVideoProps = {
  /** Bunny player iframe URL (`https://player.mediadelivery.net/embed/{library}/{video}`). */
  embedUrl: string;
  title: string;
  duration: string | null;
  /** Server-rendered poster (a `next/image` with `fill`). */
  poster: ReactNode;
};

/**
 * Click-to-play promo video. Bunny's player page pulls in its own scripts (HLS, Plyr, jQuery), so
 * until the visitor presses play only the poster loads; the iframe then starts with autoplay, since
 * the click already asked for playback. The server only renders this for videos confirmed to exist;
 * if the iframe still fails to load, the block disappears rather than showing a broken player.
 */
export function IntroVideo({ embedUrl, title, duration, poster }: IntroVideoProps) {
  const [started, setStarted] = useState(false);
  const [failed, setFailed] = useState(false);

  if (failed) {
    return null;
  }

  return (
    <div className="relative isolate aspect-video overflow-hidden rounded-photo bg-ink">
      {started ? (
        <iframe
          src={`${embedUrl}?autoplay=true&preload=true&responsive=true`}
          title={title}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          onError={() => setFailed(true)}
          className="absolute inset-0 block size-full border-0"
        />
      ) : (
        <>
          {poster}
          <div aria-hidden="true" className="absolute inset-0 bg-ink/30" />
          <button
            type="button"
            onClick={() => setStarted(true)}
            aria-label={`تشغيل ${title}`}
            className="group absolute inset-0 flex flex-col items-center justify-center gap-3 text-white"
          >
            <span className="grid size-20 place-items-center rounded-full bg-accent text-on-accent shadow-lg transition-transform duration-200 group-hover:scale-110 group-focus-visible:scale-110 motion-reduce:transition-none">
              <Play aria-hidden="true" className="size-8 translate-x-[2px] fill-current" />
            </span>
            <span className="rounded-full bg-ink/70 px-3 py-1 text-sm font-medium">
              شاهد الفيديو التعريفي
              {duration ? (
                <span dir="ltr" className="ms-2 tabular-nums text-white/75">
                  {duration}
                </span>
              ) : null}
            </span>
          </button>
        </>
      )}
    </div>
  );
}
