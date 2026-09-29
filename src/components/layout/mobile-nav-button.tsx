"use client";

import { useRef } from "react";

import { MenuIcon, XIcon, type AnimatedIconHandle } from "@/components/icons/animated";

type MobileNavButtonProps = {
  popoverId: string;
  action: "open" | "close";
  className?: string;
};

/** Native popover trigger (works without JS) with an animated menu/close icon. */
export function MobileNavButton({ popoverId, action, className }: MobileNavButtonProps) {
  const icon = useRef<AnimatedIconHandle>(null);
  const play = () => icon.current?.startAnimation();
  const stop = () => icon.current?.stopAnimation();
  const Icon = action === "open" ? MenuIcon : XIcon;

  return (
    <button
      type="button"
      popoverTarget={popoverId}
      popoverTargetAction={action === "open" ? "show" : "hide"}
      aria-label={action === "open" ? "فتح القائمة" : "إغلاق القائمة"}
      onMouseEnter={play}
      onMouseLeave={stop}
      onFocus={play}
      onBlur={stop}
      className={className ?? "ma-btn ma-btn--outline ma-btn--icon ma-btn--sm size-11"}
    >
      <Icon ref={icon} size={20} />
    </button>
  );
}
