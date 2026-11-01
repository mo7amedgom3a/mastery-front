"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef, type ReactNode } from "react";

/**
 * The page root and its scroll choreography. The sections stay server-rendered and fully visible;
 * this only adds motion on top, and reduced-motion visitors get the static page.
 */
export function SalesLandingMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scope = root.current;
    if (!scope) return;

    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia(scope);
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const q = gsap.utils.selector(scope);
      const enter = { y: 26, opacity: 0, duration: 0.7, ease: "power3.out", clearProps: "transform,opacity" };

      gsap.to(q(".progress"), { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 0.3 } });

      gsap
        .timeline({ defaults: { ease: "power3.out", duration: 0.9 } })
        .from(q(".hero .eyebrow"), { y: 26, opacity: 0 })
        .from(q(".hero h1 .ln > span"), { yPercent: 110, duration: 1.1, stagger: 0.12, ease: "expo.out" }, "-=0.6")
        .from(q(".hero .lead"), { y: 26, opacity: 0 }, "-=0.75")
        .from(q(".hero-ctas > *"), { y: 26, opacity: 0, stagger: 0.08 }, "-=0.7")
        .from(q(".stats .stat"), { y: 26, opacity: 0, stagger: 0.08 }, "-=0.6");

      gsap.to(q(".hero-body"), {
        yPercent: -6,
        opacity: 0.4,
        ease: "none",
        scrollTrigger: { trigger: q(".hero")[0], start: "top top", end: "bottom top", scrub: true },
      });

      q("[data-parallax]").forEach((element) => {
        gsap.fromTo(
          element,
          { yPercent: -7 },
          {
            yPercent: 7,
            ease: "none",
            scrollTrigger: { trigger: element.parentElement, start: "top bottom", end: "bottom top", scrub: true },
          },
        );
      });

      q("[data-reveal]").forEach((element) => {
        gsap.from(element, { ...enter, scrollTrigger: { trigger: element, start: "top 88%", once: true } });
      });
      q("[data-stagger]").forEach((list) => {
        gsap.from(list.children, { ...enter, stagger: 0.08, scrollTrigger: { trigger: list, start: "top 85%", once: true } });
      });

      q(".feat").forEach((element) => {
        ScrollTrigger.create({ trigger: element, start: "top 62%", end: "bottom 38%", toggleClass: "is-on" });
      });

      gsap.from(q(".exp-card"), {
        clipPath: "inset(100% 0% 0% 0%)",
        duration: 1.1,
        stagger: 0.08,
        ease: "expo.out",
        clearProps: "clipPath",
        scrollTrigger: { trigger: q(".exp-grid")[0], start: "top 80%", once: true },
      });

      gsap
        .timeline({ scrollTrigger: { trigger: q(".steps3")[0], start: "top 80%", once: true } })
        .from(q(".draw-line"), { scaleX: 0, duration: 1.1, ease: "power3.inOut" })
        .from(q(".step"), { ...enter, stagger: 0.12 }, "-=0.6");

      gsap.fromTo(
        q(".big-num"),
        { scale: 0.92, opacity: 0.4 },
        { scale: 1, opacity: 1, ease: "none", scrollTrigger: { trigger: q(".big-num")[0], start: "top 90%", end: "top 45%", scrub: true } },
      );

      const counters = q("[data-count]").map((element) => {
        const final = element.textContent;
        const count = { value: 0 };
        element.textContent = "0";
        gsap.to(count, {
          value: Number(final),
          duration: 1.6,
          ease: "power2.out",
          delay: element.closest(".hero") ? 0.9 : 0,
          scrollTrigger: { trigger: element, start: "top 90%", once: true },
          onUpdate: () => {
            element.textContent = String(Math.round(count.value));
          },
        });
        return () => {
          element.textContent = final;
        };
      });

      return () => counters.forEach((restore) => restore());
    });

    return () => media.revert();
  }, []);

  return (
    <div ref={root} className="sales-lp">
      <div className="progress" aria-hidden="true" />
      {children}
    </div>
  );
}
