"use client";

import { clsx } from "clsx";
import { forwardRef, useImperativeHandle, useRef } from "react";

import { HeartIcon, type AnimatedIconHandle } from "./animated";

type HeartFillIconProps = {
  filled: boolean;
  size?: number;
  className?: string;
};

/**
 * lucide-animated Heart with a "liquid" fill: a second, coral-filled heart is revealed from the
 * bottom up (clip-path transition) when `filled` turns on. Both layers share the same beat
 * animation through the forwarded handle, so they always move together.
 */
export const HeartFillIcon = forwardRef<AnimatedIconHandle, HeartFillIconProps>(function HeartFillIcon(
  { filled, size = 18, className },
  forwardedRef,
) {
  const outline = useRef<AnimatedIconHandle>(null);
  const fill = useRef<AnimatedIconHandle>(null);

  useImperativeHandle(forwardedRef, () => ({
    startAnimation: () => {
      outline.current?.startAnimation();
      fill.current?.startAnimation();
    },
    stopAnimation: () => {
      outline.current?.stopAnimation();
      fill.current?.stopAnimation();
    },
  }));

  return (
    <span aria-hidden="true" className={clsx("relative inline-grid", className)} style={{ width: size, height: size }}>
      <HeartIcon ref={outline} size={size} className="col-start-1 row-start-1 grid place-items-center" />
      <span
        className={clsx(
          "col-start-1 row-start-1 grid place-items-center text-accent transition-[clip-path] duration-500 ease-out motion-reduce:transition-none",
          filled ? "[clip-path:inset(0_0_0_0)]" : "[clip-path:inset(100%_0_0_0)]",
        )}
      >
        <HeartIcon ref={fill} size={size} className="grid place-items-center [&_path]:fill-current" />
      </span>
    </span>
  );
});
