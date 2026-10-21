"use client";

import { create } from "zustand";

import {
  getUnreadCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type CustomerNotification,
} from "@/lib/api/notifications";

type NotificationsState = {
  unread: number;
  items: CustomerNotification[] | null;
  status: "idle" | "loading" | "ready" | "error";
};

/**
 * The signed-in customer's notifications. Plain zustand rather than React Query: the bell lives in
 * the site header, which renders on static pages too, and those don't mount a QueryClient.
 */
export const useNotificationsStore = create<NotificationsState>(() => ({ unread: 0, items: null, status: "idle" }));

export async function refreshUnread(): Promise<void> {
  try {
    const { unread } = await getUnreadCount();
    useNotificationsStore.setState({ unread });
  } catch {
    // The bell just keeps its last count; a signed-out session is handled by the auth store.
  }
}

export async function loadNotifications(limit: number): Promise<void> {
  useNotificationsStore.setState((state) => ({ status: state.items ? state.status : "loading" }));
  try {
    const page = await listNotifications(limit);
    useNotificationsStore.setState({ items: page.items, status: "ready" });
  } catch {
    useNotificationsStore.setState((state) => ({ status: state.items ? "ready" : "error" }));
  }
}

/** Refresh both the count and the open list, e.g. after a refund request was sent. */
export function refreshNotifications(limit = 20): Promise<unknown> {
  return Promise.all([refreshUnread(), loadNotifications(limit)]);
}

export async function markRead(id: string): Promise<void> {
  const readAt = new Date().toISOString();
  useNotificationsStore.setState((state) => ({
    unread: Math.max(0, state.unread - 1),
    items: state.items?.map((item) => (item.notification_id === id ? { ...item, read_at: readAt } : item)) ?? null,
  }));
  await markNotificationRead(id).catch(() => undefined);
  await refreshUnread();
}

export async function markAllRead(): Promise<void> {
  const readAt = new Date().toISOString();
  useNotificationsStore.setState((state) => ({
    unread: 0,
    items: state.items?.map((item) => (item.read_at ? item : { ...item, read_at: readAt })) ?? null,
  }));
  await markAllNotificationsRead().catch(() => undefined);
  await refreshUnread();
}
