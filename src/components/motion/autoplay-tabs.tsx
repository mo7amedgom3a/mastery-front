"use client";

// clsx, not cn(): no class conflicts to merge here, and it keeps tailwind-merge out of the client bundle.
import { clsx as cn } from "clsx";
import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";

export type AutoplayTab = {
  id: string;
  label: string;
};

type AutoplayTabsProps = {
  /** Prefix for tab/panel ids (must be unique on the page). */
  idPrefix: string;
  label: string;
  tabs: readonly AutoplayTab[];
  /**
   * Server-rendered panels, same order as `tabs`. All are in the HTML; inactive ones are `hidden`.
   * Children marked `data-tab-animate` get a staggered GSAP entrance on every tab change.
   */
  panels: readonly ReactNode[];
  intervalMs?: number;
  className?: string;
};

type Gsap = typeof import("gsap").gsap;
let gsapPromise: Promise<Gsap> | null = null;
/** GSAP is loaded on demand (when the tabs first come into view), never in the initial bundle. */
function loadGsap(): Promise<Gsap> {
  gsapPromise ??= import("gsap").then((module) => module.gsap);
  return gsapPromise;
}

/**
 * Timed step tabs (ARIA tabs pattern) that always auto-advance, including after a manual pick and
 * while hovered. The progress bar is a CSS animation; when it ends, the next tab activates, so
 * there are no timers. Advancing pauses only while the section is off-screen or the browser tab is
 * hidden. Under reduced motion the kit disables animations, so nothing auto-advances and GSAP
 * entrances are skipped.
 */
export function AutoplayTabs({ idPrefix, label, tabs, panels, intervalMs = 7000, className }: AutoplayTabsProps) {
  const [active, setActive] = useState(0);
  const [inView, setInView] = useState(false);
  const [pageHidden, setPageHidden] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const panelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const firstRender = useRef(true);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        if (entry.isIntersecting) void loadGsap();
      },
      { threshold: 0.25 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onVisibility = () => setPageHidden(document.visibilityState === "hidden");
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  // GSAP entrance for the newly active panel (skipped on first paint: SSR content is already there).
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const panel = panelRefs.current[active];
    if (!panel || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let tween: { kill: () => void } | undefined;
    let cancelled = false;
    void loadGsap().then((gsap) => {
      if (cancelled) return;
      const items = panel.querySelectorAll<HTMLElement>("[data-tab-animate]");
      tween = gsap.fromTo(
        items.length > 0 ? items : panel,
        { autoAlpha: 0, y: 28, filter: "blur(6px)" },
        {
          autoAlpha: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.65,
          stagger: 0.07,
          ease: "power3.out",
          clearProps: "opacity,visibility,transform,filter",
        },
      );
    });
    return () => {
      cancelled = true;
      tween?.kill();
    };
  }, [active]);

  const running = inView && !pageHidden;

  const select = (index: number, focus = false) => {
    const next = (index + tabs.length) % tabs.length;
    setActive(next);
    if (focus) tabRefs.current[next]?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const rtl = getComputedStyle(event.currentTarget).direction === "rtl";
    const keyMap: Record<string, number> = {
      ArrowLeft: rtl ? active + 1 : active - 1,
      ArrowRight: rtl ? active - 1 : active + 1,
      Home: 0,
      End: tabs.length - 1,
    };
    if (event.key in keyMap) {
      event.preventDefault();
      select(keyMap[event.key], true);
    }
  };

  const progressStyle = { "--tab-duration": `${intervalMs}ms` } as CSSProperties;

  return (
    <div ref={rootRef} className={cn("grid gap-10 md:grid-cols-[minmax(0,17rem)_minmax(0,1fr)] md:gap-16", className)}>
      <div
        role="tablist"
        aria-label={label}
        aria-orientation="vertical"
        onKeyDown={onKeyDown}
        className="-mx-4 flex gap-6 self-start overflow-x-auto px-4 pb-1 md:mx-0 md:flex-col md:gap-0 md:overflow-visible md:px-0"
      >
        {tabs.map((tab, index) => {
          const selected = index === active;
          return (
            <button
              key={tab.id}
              ref={(node) => {
                tabRefs.current[index] = node;
              }}
              type="button"
              role="tab"
              id={`${idPrefix}-tab-${tab.id}`}
              aria-controls={`${idPrefix}-panel-${tab.id}`}
              aria-selected={selected}
              tabIndex={selected ? 0 : -1}
              onClick={() => select(index)}
              className={cn(
                "flex min-h-11 shrink-0 cursor-pointer flex-col gap-3 bg-transparent pt-3 text-start text-lg font-medium transition-colors md:py-4",
                selected ? "text-fg" : "text-fg-muted hover:text-fg",
              )}
            >
              <span className="whitespace-nowrap">{tab.label}</span>
              <span className="tab-progress w-full" aria-hidden="true">
                {selected ? (
                  <span
                    // Re-keyed on every change so the bar restarts from zero, even on a manual pick.
                    key={active}
                    className="tab-progress__bar block"
                    style={progressStyle}
                    data-running=""
                    data-paused={running ? undefined : ""}
                    onAnimationEnd={() => setActive((current) => (current + 1) % tabs.length)}
                  />
                ) : null}
              </span>
            </button>
          );
        })}
      </div>

      <div className="min-w-0">
        {tabs.map((tab, index) => (
          <div
            key={tab.id}
            ref={(node) => {
              panelRefs.current[index] = node;
            }}
            role="tabpanel"
            id={`${idPrefix}-panel-${tab.id}`}
            aria-labelledby={`${idPrefix}-tab-${tab.id}`}
            hidden={index !== active}
            tabIndex={0}
          >
            {panels[index]}
          </div>
        ))}
      </div>
    </div>
  );
}
