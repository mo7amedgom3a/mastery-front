"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { animate, motion, useMotionValue, useReducedMotion, type PanInfo } from "motion/react";
import { Children, useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/cn";

type CardCarouselProps = {
  /** Accessible name for the list. */
  label: string;
  /** One element per card; each becomes a list item. */
  children: ReactNode;
  className?: string;
};

/** Pixels (or px/s of flick velocity) a drag must cover before it moves to the next card. */
const SWIPE_DISTANCE = 40;
const SWIPE_VELOCITY = 400;
const SPRING = { type: "spring", stiffness: 300, damping: 30 } as const;

/**
 * Multi-card carousel (Motion). Cards per view come from CSS (`--per-view` at the kit breakpoints),
 * so the server render already has the final layout; JS only moves the track. The arrows never cover
 * a card: from 900px they sit in their own lanes beside the track, below that in a row under it.
 * Everything stays inside the page container's gutter, clear of the screen edges. RTL-aware: the
 * first card is at the inline start and "next" moves toward the inline end.
 */
export function CardCarousel({ label, children, className }: CardCarouselProps) {
  const items = Children.toArray(children);
  const viewportRef = useRef<HTMLDivElement>(null);
  const draggedRef = useRef(false);
  const [index, setIndex] = useState(0);
  const [perView, setPerView] = useState(1);
  const [step, setStep] = useState(0);
  const [rtl, setRtl] = useState(false);
  const reduceMotion = useReducedMotion();
  const x = useMotionValue(0);

  const maxIndex = Math.max(0, items.length - perView);
  const current = Math.min(index, maxIndex);
  // Track offset for a card index: negative in LTR, positive in RTL.
  const offsetFor = useCallback((i: number) => (rtl ? 1 : -1) * i * step, [rtl, step]);

  // Measure cards per view, the per-card step (card width + gap) and direction.
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const measure = () => {
      const style = getComputedStyle(viewport);
      const count = Number.parseInt(style.getPropertyValue("--per-view"), 10) || 1;
      const gap = Number.parseFloat(style.getPropertyValue("--gap")) || 0;
      setPerView(count);
      setStep((viewport.clientWidth + gap) / count);
      setRtl(style.direction === "rtl");
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const controls = animate(x, offsetFor(current), reduceMotion ? { duration: 0 } : SPRING);
    return () => controls.stop();
  }, [x, current, offsetFor, reduceMotion]);

  const clamp = (next: number) => Math.max(0, Math.min(maxIndex, next));
  const go = (next: number) => setIndex(clamp(next));

  const onDragEnd = (_: unknown, info: PanInfo) => {
    // Toward the inline end = dragging left in LTR, right in RTL.
    const towardEnd = rtl ? info.offset.x : -info.offset.x;
    const velocity = rtl ? info.velocity.x : -info.velocity.x;
    const cards = Math.max(1, Math.round(Math.abs(towardEnd) / (step || 1)));
    let next = current;
    if (towardEnd > SWIPE_DISTANCE || velocity > SWIPE_VELOCITY) next = clamp(current + cards);
    else if (towardEnd < -SWIPE_DISTANCE || velocity < -SWIPE_VELOCITY) next = clamp(current - cards);
    setIndex(next);
    // Settle explicitly: at either end the index doesn't change, so the effect wouldn't run.
    animate(x, offsetFor(next), reduceMotion ? { duration: 0 } : SPRING);
    // Keep the click that ends a drag from following the card link.
    requestAnimationFrame(() => {
      draggedRef.current = false;
    });
  };

  const scrollable = maxIndex > 0;
  const limit = maxIndex * step;

  return (
    // Below 900px the track takes the first (full-width) row and the arrows wrap under it;
    // from 900px the arrows flank the track in one row.
    <div
      className={cn(
        "flex flex-wrap items-center justify-center gap-x-3 gap-y-5 md:flex-nowrap md:gap-x-3",
        className,
      )}
    >
      {scrollable ? (
        <CarouselButton side="start" label="السابق" disabled={current === 0} onClick={() => go(current - 1)} />
      ) : null}
      <div
        ref={viewportRef}
        // `clip` (not `hidden`) so focusing an off-screen card can't scroll the viewport natively.
        className="order-first min-w-0 basis-full overflow-x-clip md:order-none md:flex-1 md:basis-0 [--gap:var(--space-6)] [--per-view:1] sm:[--per-view:2] md:[--per-view:3] lg:[--per-view:4]"
        onDragStartCapture={(event) => event.preventDefault()}
        onClickCapture={(event) => {
          if (draggedRef.current) {
            event.preventDefault();
            event.stopPropagation();
          }
        }}
      >
        <motion.ul
          aria-label={label}
          className={cn("m-0 flex list-none gap-(--gap) p-0", scrollable && "cursor-grab active:cursor-grabbing")}
          style={{ x, touchAction: "pan-y" }}
          drag={scrollable ? "x" : false}
          dragConstraints={rtl ? { left: 0, right: limit } : { left: -limit, right: 0 }}
          dragElastic={0.12}
          dragMomentum={false}
          onDragStart={() => {
            draggedRef.current = true;
          }}
          onDragEnd={onDragEnd}
        >
          {items.map((item, i) => (
            <li
              key={(item as { key?: string | null }).key ?? i}
              className="min-w-0 shrink-0 basis-[calc((100%-(var(--per-view)-1)*var(--gap))/var(--per-view))]"
              // Keyboard users tabbing onto an off-screen card bring it into view.
              onFocus={() => {
                if (i < current) go(i);
                else if (i >= current + perView) go(i - perView + 1);
              }}
            >
              {item}
            </li>
          ))}
        </motion.ul>
      </div>
      {scrollable ? (
        <CarouselButton side="end" label="التالي" disabled={current === maxIndex} onClick={() => go(current + 1)} />
      ) : null}
    </div>
  );
}

function CarouselButton({
  side,
  label,
  disabled,
  onClick,
}: {
  side: "start" | "end";
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  // Chevrons point outward: left/right in LTR, mirrored in RTL.
  const Icon = side === "start" ? ChevronLeft : ChevronRight;
  return (
    <motion.button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      whileHover={disabled ? undefined : { scale: 1.08 }}
      whileTap={disabled ? undefined : { scale: 0.94 }}
      className={cn(
        "grid size-11 shrink-0 place-items-center rounded-full border border-line-strong bg-surface text-fg shadow-sm transition-opacity",
        disabled ? "cursor-not-allowed opacity-40" : "opacity-90 hover:opacity-100",
      )}
    >
      <Icon aria-hidden className="size-5 rtl:-scale-x-100" strokeWidth={2} />
    </motion.button>
  );
}
