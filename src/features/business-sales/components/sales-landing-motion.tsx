"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef, type ReactNode } from "react";

/** Progressive motion: the server-rendered page is readable before JS and with reduced motion. */
export function SalesLandingMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scope = root.current;
    if (!scope) return;

    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia(scope);
    const q = gsap.utils.selector(scope);
    const coral = getComputedStyle(scope).getPropertyValue("--coral").trim();

    /** Each segment fills before the next marker activates; scrubbing reverses the path naturally. */
    const connectSteps = (
      steps: Element[],
      markerSelector: string,
      fillSelector: string,
      axis: "scaleX" | "scaleY",
      start: string,
      end: string,
    ) => {
      if (steps.length === 0) return;
      const timeline = gsap.timeline({
        scrollTrigger: { trigger: steps[0].parentElement, start, end, scrub: .7, invalidateOnRefresh: true },
      });
      steps.forEach((step) => {
        const marker = step.querySelector(markerSelector);
        const fill = step.querySelector(fillSelector);
        if (marker) timeline.to(marker, { backgroundColor: coral, borderColor: coral, scale: 1.12, duration: .22, ease: "power1.out" });
        if (fill) timeline.to(fill, { [axis]: 1, duration: .78, ease: "none" });
      });
    };

    media.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.timeline({ defaults: { ease: "power3.out" } })
        .from(q(".sales-hero__copy > *"), { y: 20, opacity: 0, duration: .6, stagger: .09 })
        .from(q(".sales-hero__art"), { y: 30, opacity: 0, duration: .7 }, "-=.35")
        .from(q(".sales-hero__art-point"), { scale: .7, opacity: 0, duration: .4, stagger: .1 }, "-=.25");

      gsap.to(q(".sales-hero__art-point"), {
        y: -6, duration: 2.5, stagger: .25, delay: 1.4, repeat: -1, yoyo: true, ease: "sine.inOut",
      });

      q(".ma-sechead").forEach((header) => {
        gsap.from(header, {
          y: 18, opacity: 0, duration: .6, ease: "power2.out",
          scrollTrigger: { trigger: header, start: "top 88%", once: true },
          clearProps: "transform,opacity",
        });
      });

      q("[data-sales-stagger]").forEach((group) => {
        gsap.from(group.children, {
          y: 26, opacity: 0, duration: .55, stagger: .07, ease: "power2.out",
          scrollTrigger: { trigger: group, start: "top 85%", once: true },
          clearProps: "transform,opacity",
        });
      });
      q("[data-sales-reveal]").forEach((item) => {
        gsap.from(item, {
          y: 18, opacity: 0, duration: .55, ease: "power2.out",
          scrollTrigger: { trigger: item, start: "top 88%", once: true },
          clearProps: "transform,opacity",
        });
      });

      connectSteps(
        q(".sales-value__steps li"), ".sales-value__number", ".sales-value__fill",
        "scaleY", "top 80%", "bottom 35%",
      );

      gsap.from(q("[data-sales-experts] > *"), {
        y: 32, opacity: 0, duration: .65, stagger: .08, ease: "power2.out",
        scrollTrigger: { trigger: q("[data-sales-experts]")[0], start: "top 82%", once: true },
        clearProps: "transform,opacity",
      });
      gsap.from(q(".sales-expert__photo"), {
        clipPath: "inset(0 0 100% 0)", duration: .8, stagger: .08, ease: "power3.out",
        scrollTrigger: { trigger: q("[data-sales-experts]")[0], start: "top 82%", once: true },
        clearProps: "clipPath",
      });
    });
    media.add("(prefers-reduced-motion: no-preference) and (min-width: 851px)", () => {
      connectSteps(
        q(".sales-journey__step"), ".sales-journey__dot", ".sales-journey__fill",
        "scaleX", "top 82%", "bottom 42%",
      );
    });
    media.add("(prefers-reduced-motion: no-preference) and (max-width: 850px)", () => {
      connectSteps(
        q(".sales-journey__step"), ".sales-journey__dot", ".sales-journey__fill",
        "scaleY", "top 82%", "bottom 42%",
      );
    });
    return () => media.revert();
  }, []);

  return <div ref={root} className="sales-page">{children}</div>;
}
