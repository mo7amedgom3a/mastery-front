"use client";

import { clsx } from "clsx";
import { useRef } from "react";

import { MoonIcon, SunIcon, type AnimatedIconHandle } from "@/components/icons/animated";

import { THEME_STORAGE_KEY, type Theme } from "./theme-script";

/**
 * Light/dark switch following the kit's `data-theme` contract. Both icons are rendered and CSS
 * shows the right one, so the server HTML never disagrees with the client.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const sun = useRef<AnimatedIconHandle>(null);
  const moon = useRef<AnimatedIconHandle>(null);

  const toggle = () => {
    const root = document.documentElement;
    const next: Theme = root.getAttribute("data-theme") === "light" ? "dark" : "light";
    root.setAttribute("data-theme", next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Private mode / blocked storage: the switch still works for this page view.
    }
  };

  const play = () => {
    sun.current?.startAnimation();
    moon.current?.startAnimation();
  };
  const stop = () => {
    sun.current?.stopAnimation();
    moon.current?.stopAnimation();
  };

  return (
    <button
      type="button"
      onClick={toggle}
      onMouseEnter={play}
      onMouseLeave={stop}
      onFocus={play}
      onBlur={stop}
      aria-label="تبديل الوضع الفاتح والداكن"
      className={clsx("ma-btn ma-btn--outline ma-btn--icon ma-btn--sm size-11", className)}
    >
      <SunIcon ref={sun} size={20} className="theme-dark-only" />
      <MoonIcon ref={moon} size={20} className="theme-light-only" />
    </button>
  );
}
