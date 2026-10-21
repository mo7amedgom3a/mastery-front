"use client";

import { Bell } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { AppLink } from "@/components/ui/app-link";
import { routes } from "@/config/routes";

import { NotificationList } from "./notification-list";
import { refreshUnread, useNotificationsStore } from "./use-notifications";

const POLL_MS = 60_000;

/**
 * The header bell for a signed-in customer: unread count, and a panel with the latest notifications.
 * Closes on Escape (focus back on the bell), on a click outside, and after opening a notification.
 */
export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const unread = useNotificationsStore((state) => state.unread);

  // Polled, so a refund decision shows up without a reload.
  useEffect(() => {
    void refreshUnread();
    const timer = window.setInterval(() => void refreshUnread(), POLL_MS);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const label = unread ? `الإشعارات: ${unread} غير مقروء` : "الإشعارات";
  return (
    // Phones reach notifications from the drawer's account links, like the account menu.
    <div ref={rootRef} className="relative max-sm:hidden">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={label}
        onClick={() => setOpen((value) => !value)}
        className="ma-btn ma-btn--bare relative min-h-11 min-w-11 px-2"
      >
        <Bell aria-hidden="true" className="size-5 fill-none" />
        {unread ? (
          <span
            aria-hidden="true"
            className="absolute end-1 top-1 grid min-w-5 place-items-center rounded-full bg-accent px-1 text-xs leading-5 font-bold text-ink"
          >
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          id={panelId}
          className="absolute end-0 top-[calc(100%+0.5rem)] z-50 flex max-h-[70vh] w-[min(22rem,calc(100vw-2rem))] flex-col gap-2 overflow-y-auto rounded-panel border border-line-strong bg-surface p-2 shadow-lg"
        >
          <div className="flex items-center justify-between gap-2 border-b border-line px-3 pt-2 pb-3">
            <span className="font-bold">الإشعارات</span>
            <AppLink href={routes.studentNotifications} onClick={() => setOpen(false)} className="text-sm text-fg">
              عرض الكل
            </AppLink>
          </div>
          <NotificationList limit={8} onOpen={() => setOpen(false)} />
        </div>
      ) : null}
    </div>
  );
}
