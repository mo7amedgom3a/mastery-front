import { customerRequest, withAuthCookies } from "@/lib/api/customers";

export type CustomerNotification = {
  notification_id: string;
  kind: string;
  title: string;
  body: string;
  /** Site path the notification opens, e.g. the order it is about. */
  link_path: string | null;
  data: Record<string, unknown> | null;
  read_at: string | null;
  created_at: string;
};

export type NotificationsPage = { items: CustomerNotification[]; limit: number; offset: number };

export function listNotifications(limit: number, signal?: AbortSignal): Promise<NotificationsPage> {
  return customerRequest("GET", "/api/v1/me/notifications", { ...withAuthCookies({ signal }), query: { limit } });
}

export function getUnreadCount(signal?: AbortSignal): Promise<{ unread: number }> {
  return customerRequest("GET", "/api/v1/me/notifications/unread-count", withAuthCookies({ signal }));
}

export function markNotificationRead(id: string): Promise<{ updated: number }> {
  return customerRequest("POST", "/api/v1/me/notifications/{notification_id}/read", {
    ...withAuthCookies(),
    path: { notification_id: id },
  });
}

export function markAllNotificationsRead(): Promise<{ updated: number }> {
  return customerRequest("POST", "/api/v1/me/notifications/read-all", withAuthCookies());
}
