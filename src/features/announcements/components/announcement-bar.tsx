"use client";

import { ChevronLeft, ChevronRight, Pause, Play, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";

import { Marquee } from "@/components/motion/marquee";
import type { AnnouncementBar as Bar, AnnouncementItem } from "@/lib/api/announcements";
import { useAuthStore } from "@/lib/auth/store";
import { cn } from "@/lib/cn";

import { barStyleVars, dismissBar, dismissKey, isDismissed, pickBar, type Viewer } from "../model/bar";
import { AnnouncementItemView } from "./announcement-item";
import { useAnnouncementBars } from "./announcements-context";

const noopSubscribe = () => () => {};

function useViewer(): Viewer {
  const status = useAuthStore((state) => state.status);
  if (status === "authenticated") return "signed_in";
  if (status === "unauthenticated") return "guest";
  return "unknown";
}

/**
 * The admin-controlled promo strip above the site header (rendered by `SiteHeader`). Server-rendered for
 * `all`-audience bars on the matching page; audience and dismissal are refined after mount, and a pre-paint
 * script (`dismissScript`) hides a dismissed bar before it can flash.
 */
export function AnnouncementBar() {
  const bars = useAnnouncementBars();
  const pathname = usePathname() ?? "/";
  const viewer = useViewer();
  // False while server-rendering and hydrating, true after: storage is only read once it matches the server HTML.
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const [closed, setClosed] = useState<string | null>(null);

  const bar = useMemo(
    () => pickBar(bars, pathname, viewer, (b) => mounted && (closed === dismissKey(b) || isDismissed(b))),
    [bars, pathname, viewer, mounted, closed],
  );

  if (!bar) return null;

  const close = () => {
    dismissBar(bar);
    setClosed(dismissKey(bar));
  };

  return <BarView key={dismissKey(bar)} bar={bar} onClose={bar.dismissible ? close : undefined} />;
}

type BarViewProps = {
  bar: Bar;
  onClose?: () => void;
  /** Admin preview: always animate, never persist anything. */
  preview?: boolean;
};

export function BarView({ bar, onClose, preview }: BarViewProps) {
  const [ended, setEnded] = useState<string[]>([]);
  const items = useMemo(() => bar.items.filter((item) => !ended.includes(item.id)), [bar.items, ended]);
  const onExpire = useCallback((id: string) => setEnded((current) => (current.includes(id) ? current : [...current, id])), []);
  const [index, setIndex] = useState(0);
  const current = items.length ? items[index % items.length] : null;

  if (!current) return null;

  const rotating = bar.layout === "rotate" || bar.layout === "inline";
  const style = barStyleVars(bar.style, rotating ? current : null);

  return (
    <section
      aria-label="عروض وإعلانات"
      data-ann={dismissKey(bar)}
      data-layout={bar.layout}
      data-height={bar.style.height}
      className={cn("ma-announce", bar.style.bg.animated && "ma-announce--animated")}
      style={style}
    >
      <div className="ma-container ma-announce__inner">
        {bar.layout === "marquee" ? (
          <Marquee
            items={items}
            getKey={(item) => item.id}
            label="العروض الحالية"
            duration={Math.max(18, items.length * 12)}
            repeat={items.length < 3 ? 4 : 2}
            className="ma-announce__marquee"
            renderItem={(item) => <AnnouncementItemView item={item} barId={bar.id} onExpire={onExpire} />}
          />
        ) : null}

        {bar.layout === "inline" ? (
          <ul className="ma-announce__inline max-md:hidden" aria-label="العروض الحالية">
            {items.map((item) => (
              <li key={item.id}>
                <AnnouncementItemView item={item} barId={bar.id} onExpire={onExpire} />
              </li>
            ))}
          </ul>
        ) : null}

        {rotating ? (
          <Rotator
            items={items}
            index={index % items.length}
            onIndex={setIndex}
            intervalMs={bar.rotate_interval_ms}
            barId={bar.id}
            onExpire={onExpire}
            className={bar.layout === "inline" ? "md:hidden" : undefined}
            preview={preview}
          />
        ) : null}

        {onClose ? (
          <button type="button" onClick={onClose} className="ma-announce__close" aria-label="إغلاق شريط العروض">
            <X aria-hidden="true" className="size-4" />
          </button>
        ) : null}
      </div>
    </section>
  );
}

type RotatorProps = {
  items: AnnouncementItem[];
  index: number;
  onIndex: (updater: (index: number) => number) => void;
  intervalMs: number;
  barId: string;
  onExpire: (id: string) => void;
  className?: string;
  preview?: boolean;
};

/** One item at a time. Auto-advances unless hovered, focused, paused, or the visitor prefers reduced motion. */
function Rotator({ items, index, onIndex, intervalMs, barId, onExpire, className, preview }: RotatorProps) {
  const reduced = useReducedMotion();
  const [paused, setPaused] = useState(Boolean(reduced) && !preview);
  const [hovered, setHovered] = useState(false);
  const many = items.length > 1;
  const running = many && !paused && !hovered;

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      if (document.visibilityState === "visible") onIndex((i) => i + 1);
    }, intervalMs);
    return () => clearInterval(id);
  }, [running, intervalMs, onIndex]);

  const item = items[index];
  // RTL: "next" points left.
  const step = (delta: number) => onIndex((i) => (i + delta + items.length) % items.length);

  return (
    <div
      className={cn("ma-announce__rotator", className)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setHovered(true)}
      onBlurCapture={() => setHovered(false)}
    >
      {many ? (
        <button type="button" className="ma-announce__nav" onClick={() => step(-1)} aria-label="العرض السابق">
          <ChevronRight aria-hidden="true" className="size-4" />
        </button>
      ) : null}
      <div className="ma-announce__viewport" aria-roledescription="carousel">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            aria-roledescription="slide"
            aria-label={`${index + 1} من ${items.length}`}
          >
            <AnnouncementItemView item={item} barId={barId} onExpire={onExpire} />
          </motion.div>
        </AnimatePresence>
      </div>
      {many ? (
        <>
          <button type="button" className="ma-announce__nav" onClick={() => step(1)} aria-label="العرض التالي">
            <ChevronLeft aria-hidden="true" className="size-4" />
          </button>
          <button
            type="button"
            className="ma-announce__nav max-sm:hidden"
            onClick={() => setPaused((p) => !p)}
            aria-label={paused ? "تشغيل التبديل التلقائي" : "إيقاف التبديل التلقائي"}
            aria-pressed={paused}
          >
            {paused ? <Play aria-hidden="true" className="size-3.5" /> : <Pause aria-hidden="true" className="size-3.5" />}
          </button>
        </>
      ) : null}
    </div>
  );
}
