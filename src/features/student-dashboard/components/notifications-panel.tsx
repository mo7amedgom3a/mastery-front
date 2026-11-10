"use client";

import type { Route } from "next";
import { useEffect } from "react";

import { AppLink } from "@/components/ui/app-link";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/config/routes";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/cn";

import { loadNotifications, markRead, useNotificationsStore } from "@/features/notifications/use-notifications";
import { DashboardPanel } from "./dashboard-panel";

/** The demo's compact «آخر الإشعارات» list, reading the shared notification store. */
export function NotificationsPanel() {
  const items = useNotificationsStore((state) => state.items);
  const status = useNotificationsStore((state) => state.status);

  useEffect(() => {
    if (!items && status === "idle") void loadNotifications(5);
  }, [items, status]);

  return (
    <DashboardPanel
      id="notifications-panel-title"
      title="آخر الإشعارات"
      action={
        <AppLink href={routes.studentNotifications} className="ma-btn ma-btn--ghost ma-btn--sm">
          الكل
        </AppLink>
      }
    >
      {!items && status !== "error" ? (
        <div role="status" className="flex flex-col gap-2">
          <span className="sr-only">جارٍ تحميل الإشعارات…</span>
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
        </div>
      ) : status === "error" ? (
        <p className="m-0 text-sm text-fg-muted">تعذّر تحميل الإشعارات.</p>
      ) : !items || items.length === 0 ? (
        <p className="m-0 text-sm text-fg-muted">لا توجد إشعارات بعد.</p>
      ) : (
        <ul className="m-0 flex list-none flex-col p-0">
          {items.slice(0, 3).map((item) => {
            const unread = !item.read_at;
            const body = (
              <>
                <span
                  aria-label={unread ? "غير مقروء" : undefined}
                  className={cn("mt-2 size-2 shrink-0 rounded-full", unread ? "bg-accent" : "bg-line")}
                />
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className={cn("line-clamp-2 text-sm leading-6", unread && "font-bold")}>{item.title}</span>
                  <span className="text-xs text-fg-muted">{formatDateTime(item.created_at)}</span>
                </span>
              </>
            );
            const className = "flex gap-2.5 border-t border-line py-2.5 text-start no-underline first:border-t-0 first:pt-0 last:pb-0";
            const onOpen = () => {
              if (unread) void markRead(item.notification_id);
            };

            return (
              <li key={item.notification_id}>
                {item.link_path ? (
                  <AppLink href={item.link_path as Route} onClick={onOpen} className={className}>
                    {body}
                  </AppLink>
                ) : (
                  <button
                    type="button"
                    onClick={onOpen}
                    className={cn(className, "w-full cursor-pointer border-0 bg-transparent font-[inherit]")}
                  >
                    {body}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </DashboardPanel>
  );
}
