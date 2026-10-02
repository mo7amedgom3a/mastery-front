"use client";

import { useEffect, useRef } from "react";

import { MenuIcon, XIcon, type AnimatedIconHandle } from "@/components/icons/animated";

type MobileNavButtonProps = {
  popoverId: string;
  action: "open" | "close";
  className?: string;
};

/**
 * Native popover trigger (works without JS) with an animated menu/close icon. The open button's
 * icon follows the drawer: bars while it is closed, a cross while it is open. It is not tied to
 * hover or focus, because a tap leaves the button focused and the cross would stay on screen after
 * the drawer closes.
 */
export function MobileNavButton({ popoverId, action, className }: MobileNavButtonProps) {
  const icon = useRef<AnimatedIconHandle>(null);
  const play = () => icon.current?.startAnimation();
  const stop = () => icon.current?.stopAnimation();
  const opens = action === "open";
  const Icon = opens ? MenuIcon : XIcon;

  useEffect(() => {
    if (!opens) return;
    const popover = document.getElementById(popoverId);
    if (!popover) return;
    const onToggle = (event: Event) => {
      if ((event as ToggleEvent).newState === "open") icon.current?.startAnimation();
      else icon.current?.stopAnimation();
    };
    popover.addEventListener("toggle", onToggle);
    return () => popover.removeEventListener("toggle", onToggle);
  }, [opens, popoverId]);

  return (
    <button
      type="button"
      popoverTarget={popoverId}
      popoverTargetAction={opens ? "show" : "hide"}
      aria-label={opens ? "فتح القائمة" : "إغلاق القائمة"}
      // The close cross just redraws itself on hover/focus and always ends as a cross.
      onMouseEnter={opens ? undefined : play}
      onMouseLeave={opens ? undefined : stop}
      onFocus={opens ? undefined : play}
      onBlur={opens ? undefined : stop}
      className={className ?? "ma-btn ma-btn--bare ma-btn--icon size-11"}
    >
      <Icon ref={icon} size={20} />
    </button>
  );
}
