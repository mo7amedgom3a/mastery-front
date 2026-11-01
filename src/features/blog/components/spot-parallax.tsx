"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect } from "react";

/**
 * A small GSAP scroll parallax for the author spotlight: the poster watermark drifts slower than
 * the page and the portrait settles a touch as the band leaves — the cinematic effect the
 * live-training spotlight gets from its cut-out stage. Reduced-motion visitors see the static band.
 */
export function SpotParallax() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const spot = document.querySelector<HTMLElement>(".blog-theme .spot");
    if (!spot) return;

    gsap.registerPlugin(ScrollTrigger);
    const context = gsap.context(() => {
      const trigger = { trigger: spot, start: "top bottom", end: "bottom top", scrub: true };
      gsap.to(spot.querySelector(".spot-watermark"), {
        yPercent: 26,
        ease: "none",
        scrollTrigger: trigger,
      });
      gsap.to(spot.querySelector(".spot-portrait"), {
        yPercent: 6,
        ease: "none",
        scrollTrigger: trigger,
      });
    }, spot);

    return () => context.revert();
  }, []);

  return null;
}
