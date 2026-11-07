"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Award,
  ClipboardCheck,
  Globe2,
  GraduationCap,
  Headset,
  LayoutDashboard,
  Library,
  LifeBuoy,
  Radio,
  Route,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useRef } from "react";

import { brandColorAt } from "@/components/ui/brand-colors";

import type { CSSProperties } from "react";

const ICONS: Record<string, LucideIcon> = {
  route: Route,
  library: Library,
  diploma: GraduationCap,
  custom: Sparkles,
  live: Radio,
  consult: Headset,
  reports: LayoutDashboard,
  teams: Users,
  assessments: ClipboardCheck,
  certificate: Award,
  brand: Globe2,
  support: LifeBuoy,
};

export type StackService = { icon: string; title: string; body: string };
export type StackPillar = { title: string; items: readonly StackService[] };

/**
 * "خدمات تدريب تغطي الرحلة كاملة" as scroll-stacked cards.
 *
 * Each pillar is a sticky card; as the next one reaches the top, the previous card eases back
 * (scale/opacity) and stays behind it, so the four pillars read as one stack unfolding while
 * scrolling. Motion is pure GSAP + ScrollTrigger, scoped and reverted on unmount, and skipped
 * under `prefers-reduced-motion` (the cards then simply scroll in a normal list).
 */
export function ServicesStack({ pillars }: { pillars: readonly StackPillar[] }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scope = root.current;
    if (!scope) return;

    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia(scope);

    media.add("(prefers-reduced-motion: no-preference)", () => {
      const cards = gsap.utils.toArray<HTMLElement>("[data-b2b-stack-card]", scope);
      cards.forEach((card, index) => {
        const next = cards[index + 1];
        if (!next) return;
        gsap.fromTo(
          card,
          { scale: 1, yPercent: 0, opacity: 1, filter: "blur(0px)" },
          {
            scale: 0.94,
            yPercent: -3,
            opacity: 0.22,
            filter: "blur(2px)",
            ease: "none",
            scrollTrigger: {
              trigger: next,
              start: "top 90%",
              end: "top 30%",
              scrub: 0.6,
            },
          },
        );
      });
    });

    return () => media.revert();
  }, []);

  return (
    <div ref={root} className="b2b-stack">
      {pillars.map((pillar, index) => (
        <article
          key={pillar.title}
          className="b2b-stack__card"
          data-b2b-stack-card
          style={
            {
              zIndex: index + 1,
              "--stack-accent": `var(--${brandColorAt(index)})`,
              // Each card pins a little lower than the one before, so the deck's edges stay visible.
              "--stack-top": `calc(var(--header-h) + 1rem + ${index * 0.75}rem)`,
            } as CSSProperties
          }
        >
          <header className="b2b-stack__head">
            <span aria-hidden="true" className="b2b-stack__num">
              0{index + 1}
            </span>
            <div className="min-w-0">
              <h3 className="b2b-stack__title">{pillar.title}</h3>
              <p className="b2b-stack__meta">{pillar.items.length} خدمات</p>
            </div>
          </header>
          <ul className="b2b-stack__list">
            {pillar.items.map((item) => {
              const Icon = ICONS[item.icon] ?? Sparkles;
              return (
                <li key={item.title} className="b2b-stack__item">
                  <span aria-hidden="true" className="b2b-stack__icon">
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <h4 className="b2b-stack__item-title">{item.title}</h4>
                    <p className="b2b-stack__item-body">{item.body}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </article>
      ))}
    </div>
  );
}
