"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef, type ReactNode } from "react";

/**
 * Progressive motion for the business pages.
 *
 * The server-rendered page is complete before this runs (numbers are final, every section is in the
 * DOM); the controller only adds reveals and counters. `prefers-reduced-motion` skips everything, and
 * GSAP is reverted on unmount so client navigation never leaves styles behind.
 */
export function B2bMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scope = root.current;
    if (!scope) return;

    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia(scope);
    const q = gsap.utils.selector(scope);
    const group = (value: number) => value.toLocaleString("en-US");

    media.add("(prefers-reduced-motion: no-preference)", () => {
      // Hero: copy first, then the value map.
      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .from(q("[data-b2b-hero] > *"), { y: 24, opacity: 0, duration: 0.6, stagger: 0.08 })
        .from(q("[data-b2b-hero-art]"), { y: 32, opacity: 0, duration: 0.7 }, "-=.4");

      // The success-story card breathes inside a warm glow sampled from its thumbnail.
      gsap.fromTo(
        q(".b2b-hero__glow"),
        { opacity: 0.55, scale: 0.96 },
        { opacity: 1, scale: 1.05, duration: 3.6, repeat: -1, yoyo: true, ease: "sine.inOut" },
      );

      // Section headers and generic reveals, once each.
      q(".ma-sechead").forEach((header) => {
        gsap.from(header, {
          y: 18,
          opacity: 0,
          duration: 0.6,
          ease: "power2.out",
          scrollTrigger: { trigger: header, start: "top 88%", once: true },
          clearProps: "transform,opacity",
        });
      });

      q("[data-b2b-reveal]").forEach((item) => {
        gsap.from(item, {
          y: 20,
          opacity: 0,
          duration: 0.55,
          ease: "power2.out",
          scrollTrigger: { trigger: item, start: "top 90%", once: true },
          clearProps: "transform,opacity",
        });
      });

      q("[data-b2b-stagger]").forEach((container) => {
        gsap.from(container.children, {
          y: 26,
          opacity: 0,
          duration: 0.55,
          stagger: 0.06,
          ease: "power2.out",
          scrollTrigger: { trigger: container, start: "top 88%", once: true },
          clearProps: "transform,opacity",
        });
      });

      // Numbers count up from zero once the band is in view; the final value is already in the HTML.
      q("[data-b2b-count]").forEach((node) => {
        const target = Number((node as HTMLElement).dataset.count ?? "0");
        if (!Number.isFinite(target) || target <= 0) return;
        const state = { value: 0 };
        gsap.to(state, {
          value: target,
          duration: 1.3,
          ease: "power2.out",
          scrollTrigger: { trigger: node, start: "top 92%", once: true },
          onUpdate: () => {
            (node as HTMLElement).textContent = group(Math.round(state.value));
          },
          onComplete: () => {
            (node as HTMLElement).textContent = group(target);
          },
        });
      });

      // Value blocks: the visual panel eases in while the copy is read.
      q("[data-b2b-value-art]").forEach((art) => {
        gsap.from(art, {
          y: 40,
          opacity: 0,
          scale: 0.97,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: { trigger: art, start: "top 85%", once: true },
          clearProps: "transform,opacity",
        });
      });

      // Process steps: each connector fills as the next step approaches.
      const steps = q("[data-b2b-step]");
      const first = steps[0];
      const parent = first?.parentElement;
      if (steps.length > 0 && parent) {
        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: parent,
            start: "top 78%",
            end: "bottom 40%",
            scrub: 0.7,
            invalidateOnRefresh: true,
          },
        });
        steps.forEach((step) => {
          const fill = step.querySelector("[data-b2b-step-fill]");
          if (fill) {
            timeline.to(fill, { scaleX: 1, duration: 0.7, ease: "none" });
          }
        });
      }

      // Value sections' sticky panels drift slightly for depth.
      q("[data-b2b-value]").forEach((section) => {
        const art = section.querySelector("[data-b2b-value-art]");
        if (!art) return;
        gsap.to(art, {
          y: -24,
          ease: "none",
          scrollTrigger: { trigger: section, start: "top bottom", end: "bottom top", scrub: true },
        });
      });
    });

    return () => media.revert();
  }, []);

  return (
    <div ref={root} className="b2b-page">
      {children}
    </div>
  );
}
