"use client";

import type { Route } from "next";
import { useEffect } from "react";

import { AppLink } from "@/components/ui/app-link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { CustomerNotification } from "@/lib/api/notifications";
import { cn } from "@/lib/cn";
import { formatDateTime } from "@/lib/format";

import { loadNotifications, markAllRead, markRead, useNotificationsStore } from "./use-notifications";

function NotificationItem({ item, onOpen }: { item: CustomerNotification; onOpen: (item: CustomerNotification) => void }) {
  const unread = !item.read_at;
  const body = (
    <>
      <span className="flex items-start justify-between gap-3">
        <span className={cn("text-fg", unread && "font-bold")}>{item.title}</span>
        {unread ? <span aria-label="غير مقروء" className="mt-2 size-2 shrink-0 rounded-full bg-accent" /> : null}
      </span>
      <span className="text-sm text-fg-muted">{item.body}</span>
      <span className="text-xs text-fg-muted">{formatDateTime(item.created_at)}</span>
    </>
  );
  const className = cn("flex flex-col gap-1 rounded-lg p-3 text-start no-underline hover:bg-surface-alt", unread && "bg-surface-alt");
  return item.link_path ? (
    <AppLink href={item.link_path as Route} onClick={() => onOpen(item)} className={className}>
      {body}
    </AppLink>
  ) : (
    <button type="button" onClick={() => onOpen(item)} className={cn(className, "w-full cursor-pointer border-0 bg-transparent font-[inherit]")}>
      {body}
    </button>
  );
}

/** The customer's notifications, newest first. Opening one marks it read. */
export function NotificationList({ limit, onOpen }: { limit: number; onOpen?: () => void }) {
  const items = useNotificationsStore((state) => state.items);
  const status = useNotificationsStore((state) => state.status);

  useEffect(() => {
    void loadNotifications(limit);
  }, [limit]);

  const open = (item: CustomerNotification) => {
    if (!item.read_at) void markRead(item.notification_id);
    onOpen?.();
  };

  if (status === "error") {
    return (
      <div className="ma-alert ma-alert--warning" role="alert">
        <p className="ma-alert__text">تعذّر تحميل الإشعارات. حاول مجددًا بعد قليل.</p>
      </div>
    );
  }
  if (!items) {
    return (
      <div role="status" className="flex flex-col gap-2 p-2">
        <span className="sr-only">جارٍ تحميل الإشعارات…</span>
        <Skeleton className="h-14" />
        <Skeleton className="h-14" />
      </div>
    );
  }
  if (!items.length) return <p className="m-0 p-3 text-sm text-fg-muted">لا توجد إشعارات بعد.</p>;
  const shown = items.slice(0, limit);
  return (
    <div className="flex flex-col gap-2">
      {shown.some((item) => !item.read_at) ? (
        <div className="flex justify-end">
          <Button variant="bare" size="sm" onClick={() => void markAllRead()}>
            تعليم الكل كمقروء
          </Button>
        </div>
      ) : null}
      <ul className="m-0 flex list-none flex-col gap-1 p-0">
        {shown.map((item) => (
          <li key={item.notification_id}>
            <NotificationItem item={item} onOpen={open} />
          </li>
        ))}
      </ul>
    </div>
  );
}
