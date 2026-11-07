"use client";

import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { useEffect, useState, type KeyboardEvent } from "react";

const ROTATE_MS = 7000;

/**
 * Customer-quote carousel: one quote at a time, text only.
 *
 * Arrows, dots and the keyboard move between quotes; it auto-advances every 7 seconds unless the
 * visitor hovers, focuses or prefers reduced motion (then it stays put and the controls remain).
 */
export function QuoteCarousel({ quotes, label = "آراء العملاء" }: { quotes: readonly string[]; label?: string }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const total = quotes.length;

  useEffect(() => {
    if (paused || total < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setTimeout(() => setActive((index) => (index + 1) % total), ROTATE_MS);
    return () => window.clearTimeout(id);
  }, [active, paused, total]);

  if (total === 0) return null;

  const goTo = (index: number) => setActive(((index % total) + total) % total);
  const next = () => goTo(active + 1);
  const prev = () => goTo(active - 1);

  const onKeyDown = (event: KeyboardEvent) => {
    // Arabic reads right to left: the left arrow moves forward.
    if (event.key === "ArrowLeft") next();
    else if (event.key === "ArrowRight") prev();
    else return;
    event.preventDefault();
  };

  return (
    <div
      className="b2b-quotes"
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
      }}
      onKeyDown={onKeyDown}
    >
      <figure key={active} className="b2b-quote">
        <Quote aria-hidden="true" className="b2b-quote__mark" />
        <blockquote className="b2b-quote__text" aria-live="polite">
          {quotes[active]}
        </blockquote>
      </figure>

      {total > 1 ? (
        <div className="b2b-quote__controls">
          <button
            type="button"
            onClick={prev}
            aria-label="الرأي السابق"
            className="ma-btn ma-btn--soft ma-btn--icon rounded-full"
          >
            <ChevronRight aria-hidden="true" />
          </button>
          <div className="b2b-quote__dots">
            {quotes.map((quote, index) => (
              <button
                key={quote}
                type="button"
                onClick={() => goTo(index)}
                aria-label={`عرض الرأي ${index + 1} من ${total}`}
                aria-current={index === active}
                className={index === active ? "b2b-quote__dot b2b-quote__dot--active" : "b2b-quote__dot"}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={next}
            aria-label="الرأي التالي"
            className="ma-btn ma-btn--soft ma-btn--icon rounded-full"
          >
            <ChevronLeft aria-hidden="true" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
