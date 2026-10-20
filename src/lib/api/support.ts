import { queryOptions } from "@tanstack/react-query";

import { ApiError } from "@/lib/api/client";
import { customerRequest } from "@/lib/api/customers";
import { refreshOnce } from "@/lib/auth/client";

export type SupportCategory = {
  category_id: string;
  code: string;
  name_ar: string;
  name_en: string;
  description_ar: string | null;
  description_en: string | null;
  default_priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  is_active: boolean;
  display_order: number;
};

export type SupportRelatedOption = {
  entity_type: "ORDER" | "PRODUCT" | "SUBSCRIPTION" | "CONSULTATION";
  entity_id: string;
  label: string;
  subtitle: string | null;
  status: string | null;
  group?: string;
  group_name_ar?: string;
  group_name_en?: string;
};

export type SupportAttachment = {
  attachment_id: string;
  ticket_id: string | null;
  message_id: string | null;
  uploader_type: "CUSTOMER" | "ADMIN";
  uploader_id: string;
  original_filename: string;
  content_type: string;
  size_bytes: number;
  status: "PENDING" | "UPLOADED" | "ATTACHED";
  scan_status: string;
  created_at: string;
  confirmed_at: string | null;
  download_url: string | null;
};

export type SupportTicketSummary = {
  ticket_id: string;
  ticket_number: string;
  customer_id: string;
  customer_name: string | null;
  customer_email: string | null;
  category_id: string;
  category_code: string;
  category_name_ar: string;
  category_name_en: string;
  assigned_admin_id: string | null;
  assigned_admin_name: string | null;
  subject: string;
  status: "NEW" | "OPEN" | "IN_PROGRESS" | "WAITING_FOR_CUSTOMER" | "ON_HOLD" | "RESOLVED" | "CLOSED" | "REOPENED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  requested_priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  related_entity_type: "ORDER" | "PRODUCT" | "SUBSCRIPTION" | "CONSULTATION" | null;
  related_entity_id: string | null;
  related_entity_label: string | null;
  customer_unread_count: number;
  admin_unread_count: number;
  message_count: number;
  first_response_at: string | null;
  last_activity_at: string;
  resolved_at: string | null;
  closed_at: string | null;
  csat_rating: number | null;
  sla_response_due_at: string | null;
  sla_resolution_due_at: string | null;
  sla_breached: boolean;
  created_at: string;
  updated_at: string;
};

export type SupportMessage = {
  message_id: string;
  ticket_id: string;
  sender_type: "CUSTOMER" | "ADMIN" | "SYSTEM";
  sender_customer_id: string | null;
  sender_admin_id: string | null;
  sender_name: string;
  visibility: "PUBLIC" | "INTERNAL";
  body: string;
  created_at: string;
  attachments: SupportAttachment[];
};

export type SupportTicketDetail = {
  ticket: SupportTicketSummary;
  description: string;
  csat_comment: string | null;
  csat_submitted_at: string | null;
  can_reopen: boolean;
  initial_attachments: SupportAttachment[];
  messages: SupportMessage[];
  sla: {
    ticket_id: string;
    response_due_at: string;
    resolution_due_at: string;
    first_response_at: string | null;
    resolved_at: string | null;
    response_breached: boolean;
    resolution_breached: boolean;
  } | null;
  resolutions: Array<{
    resolution_id: string;
    ticket_id: string;
    resolved_by_admin_id: string;
    resolved_by_name: string;
    resolution_type: string;
    resolution_summary: string;
    created_at: string;
  }>;
};

export type SupportTicketPage = {
  items: SupportTicketSummary[];
  total: number;
  limit: number;
  offset: number;
};

export type ListTicketsParams = {
  status?: string;
  category_id?: string;
  priority?: string;
  search?: string;
  limit?: number;
  offset?: number;
};

export type CreateTicketPayload = {
  subject: string;
  category_id: string;
  description: string;
  requested_priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  related_entity_type?: "ORDER" | "PRODUCT" | "SUBSCRIPTION" | "CONSULTATION";
  related_entity_id?: string;
  related_entity_label?: string;
  attachment_ids?: string[];
};

export const supportKeys = {
  all: ["support"] as const,
  categories: () => [...supportKeys.all, "categories"] as const,
  relatedOptions: () => [...supportKeys.all, "related-options"] as const,
  tickets: (params?: ListTicketsParams) => [...supportKeys.all, "tickets", params ?? {}] as const,
  ticket: (ticketId: string) => [...supportKeys.all, "ticket", ticketId] as const,
};

export function getSupportCategories(): Promise<SupportCategory[]> {
  return customerRequest<SupportCategory[]>("GET", "/api/v1/support/categories", {});
}

export function getSupportRelatedOptions(): Promise<SupportRelatedOption[]> {
  return customerRequest<SupportRelatedOption[]>("GET", "/api/v1/support/related-options", {});
}

export function listMyTickets(params: ListTicketsParams = {}): Promise<SupportTicketPage> {
  const query: Record<string, string | number> = {};
  if (params.status) query.status = params.status;
  if (params.category_id) query.category_id = params.category_id;
  if (params.priority) query.priority = params.priority;
  if (params.search) query.search = params.search;
  if (params.limit != null) query.limit = params.limit;
  if (params.offset != null) query.offset = params.offset;

  return customerRequest<SupportTicketPage>("GET", "/api/v1/support/tickets", { query });
}

export function getMyTicket(ticketId: string): Promise<SupportTicketDetail> {
  return customerRequest<SupportTicketDetail>("GET", `/api/v1/support/tickets/${encodeURIComponent(ticketId)}`, {});
}

export function createSupportTicket(body: CreateTicketPayload): Promise<SupportTicketSummary> {
  return customerRequest<SupportTicketSummary>("POST", "/api/v1/support/tickets", { body });
}

export function replyToSupportTicket(
  ticketId: string,
  body: { body: string; attachment_ids?: string[] },
): Promise<SupportMessage> {
  return customerRequest<SupportMessage>("POST", `/api/v1/support/tickets/${encodeURIComponent(ticketId)}/messages`, {
    body,
  });
}

export function reopenSupportTicket(
  ticketId: string,
  body: { reason: string },
): Promise<SupportTicketSummary> {
  return customerRequest<SupportTicketSummary>("POST", `/api/v1/support/tickets/${encodeURIComponent(ticketId)}/reopen`, {
    body,
  });
}

export function submitSupportFeedback(
  ticketId: string,
  body: { rating: number; comment?: string },
): Promise<{ status: string }> {
  return customerRequest<{ status: string }>("POST", `/api/v1/support/tickets/${encodeURIComponent(ticketId)}/feedback`, {
    body,
  });
}

export function getSupportAttachmentDownloadUrl(attachmentId: string): Promise<{ download_url: string }> {
  return customerRequest<{ download_url: string }>(
    "GET",
    `/api/v1/support/attachments/${encodeURIComponent(attachmentId)}/download`,
    {},
  );
}

/**
 * Uploads an attachment to private S3 via the server-side Route Handler.
 */
export async function uploadSupportAttachment(file: File, ticketId?: string): Promise<SupportAttachment> {
  const form = new FormData();
  form.append("file", file);
  if (ticketId) form.append("ticket_id", ticketId);

  const send = async () => {
    const res = await fetch("/api/support/attachments", {
      method: "POST",
      body: form,
      credentials: "same-origin",
    });
    if (res.status === 401) {
      const refreshed = await refreshOnce();
      if (!refreshed) throw new ApiError(401, "سجّل الدخول للمتابعة.", { body: { error: "unauthenticated" } });
      const retry = await fetch("/api/support/attachments", {
        method: "POST",
        body: form,
        credentials: "same-origin",
      });
      if (!retry.ok) {
        const errorData = (await retry.json().catch(() => ({}))) as Record<string, unknown>;
        const msg = typeof errorData.message === "string" ? errorData.message : "فشل رفع الملف.";
        throw new ApiError(retry.status, msg, { body: errorData });
      }
      return retry.json();
    }
    if (!res.ok) {
      const errorData = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      const msg = typeof errorData.message === "string" ? errorData.message : "فشل رفع الملف.";
      throw new ApiError(res.status, msg, { body: errorData });
    }
    return res.json();
  };

  return send();
}

export const supportQueries = {
  categories: () =>
    queryOptions({
      queryKey: supportKeys.categories(),
      queryFn: getSupportCategories,
      staleTime: 60 * 60 * 1000,
    }),
  relatedOptions: () =>
    queryOptions({
      queryKey: supportKeys.relatedOptions(),
      queryFn: getSupportRelatedOptions,
      staleTime: 5 * 60 * 1000,
    }),
  tickets: (params?: ListTicketsParams) =>
    queryOptions({
      queryKey: supportKeys.tickets(params),
      queryFn: () => listMyTickets(params),
    }),
  ticket: (ticketId: string) =>
    queryOptions({
      queryKey: supportKeys.ticket(ticketId),
      queryFn: () => getMyTicket(ticketId),
    }),
};
