"use client";

// clsx, not cn(): no class conflicts to merge here, and it keeps tailwind-merge out of the client bundle.
import { clsx as cn } from "clsx";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { PauseIcon, PlayIcon, type AnimatedIconHandle } from "@/components/icons/animated";

type LazyVideoProps = {
  src: string;
  /** Server-rendered poster (e.g. a `next/image` with `fill`). It stays underneath until playback starts. */
  poster: ReactNode;
  label: string;
  className?: string;
};

type NetworkInformation = { saveData?: boolean };

/**
 * Muted ambient video that costs nothing until it's needed. No bytes are fetched before the
 * element scrolls near the viewport, and playback runs only while it is visible. Reduced-motion
 * and Save-Data users get the poster plus a play button instead of autoplay.
 */
export function LazyVideo({ src, poster, label, className }: LazyVideoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [load, setLoad] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [visible, setVisible] = useState(false);
  const icon = useRef<AnimatedIconHandle>(null);
  const playIcon = () => icon.current?.startAnimation();
  const stopIcon = () => icon.current?.stopAnimation();

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const saveData = (navigator as Navigator & { connection?: NetworkInformation }).connection?.saveData === true;
    const autoplayAllowed = !reduceMotion && !saveData;

    const node = containerRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting);
        if (entry.isIntersecting && autoplayAllowed) setLoad(true);
      },
      { rootMargin: "200px 0px", threshold: 0.25 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Once loaded (by autoplay or by the play button), play only while on screen and not paused by the user.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !load) return;
    if (visible && !userPaused) {
      video.play().catch(() => setPlaying(false));
    } else {
      video.pause();
    }
  }, [load, visible, userPaused]);

  const toggle = () => {
    const video = videoRef.current;
    if (!load) {
      setLoad(true);
      setUserPaused(false);
      return;
    }
    if (!video) return;
    if (video.paused) {
      setUserPaused(false);
      video.play().catch(() => setPlaying(false));
    } else {
      setUserPaused(true);
      video.pause();
    }
  };

  return (
    <div ref={containerRef} className={cn("relative isolate overflow-hidden bg-ink", className)}>
      {poster}
      {load ? (
        <video
          ref={videoRef}
          src={src}
          muted
          loop
          playsInline
          preload="metadata"
          aria-label={label}
          onPlaying={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          className={cn(
            "absolute inset-0 size-full object-cover transition-opacity duration-500 motion-reduce:transition-none",
            playing ? "opacity-100" : "opacity-0",
          )}
        />
      ) : null}
      <button
        type="button"
        onClick={toggle}
        onMouseEnter={playIcon}
        onMouseLeave={stopIcon}
        onFocus={playIcon}
        onBlur={stopIcon}
        aria-label={playing ? `إيقاف ${label}` : `تشغيل ${label}`}
        className="ma-btn ma-btn--on-color ma-btn--icon absolute bottom-4 end-4 z-10 rounded-full"
      >
        {playing ? <PauseIcon ref={icon} size={20} /> : <PlayIcon ref={icon} size={20} />}
      </button>
    </div>
  );
}
