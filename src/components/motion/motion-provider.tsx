"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";

/**
 * App-wide Motion settings. `reducedMotion="user"` turns transform/layout animations off for people
 * who ask their OS for reduced motion — this covers our own micro-interactions and the
 * lucide-animated icons alike. (lucide-animated renders `motion.*` components, so LazyMotion's
 * strict mode can't be used.)
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
