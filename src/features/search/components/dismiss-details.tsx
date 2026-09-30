"use client";

import { useEffect } from "react";

/**
 * Closes the open `<details name={group}>` dropdown on a click outside it or on Escape. The
 * dropdowns themselves are plain HTML (they open, and close each other, without JavaScript); this
 * only adds the dismissal people expect from a menu.
 */
export function DismissDetails({ group }: { group: string }) {
  useEffect(() => {
    const open = () => document.querySelector<HTMLDetailsElement>(`details[name="${group}"][open]`);

    const onPointerDown = (event: PointerEvent) => {
      const details = open();
      if (details && !details.contains(event.target as Node)) details.open = false;
    };
    const onKeyDown = (event: KeyboardEvent) => {
      const details = open();
      if (event.key !== "Escape" || !details) return;
      details.open = false;
      details.querySelector("summary")?.focus();
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [group]);

  return null;
}
