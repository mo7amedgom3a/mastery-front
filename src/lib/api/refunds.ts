import { queryOptions } from "@tanstack/react-query";

import { customerRequest, withAuthCookies } from "@/lib/api/customers";

export type RefundPreview = {
  order_item_id: string;
  order_id: string;
  product_type: string;
  product_slug: string;
  provider: string;
  currency_code: string;
  allocated_minor: number;
  remaining_minor: number;
  eligible: boolean;
  reasons: string[];
  resources: { resource_id: string; resource_type: string }[];
};

export type RefundCase = {
  case_id: string;
  order_id: string;
  order_item_id: string;
  product_id: string;
  product_type: string;
  slug: string;
  status: string;
  requested_minor: number;
  approved_minor: number | null;
  currency_code: string;
  customer_reason: string;
  /** Only sent for a declined request: the team's explanation. */
  decision_reason: string | null;
  created_at: string;
  decided_at: string | null;
  completed_at: string | null;
};

export const refundKeys = {
  all: ["refunds"] as const,
  cases: () => [...refundKeys.all, "cases"] as const,
  preview: (orderId: string, itemId: string) => [...refundKeys.all, "preview", orderId, itemId] as const,
};

export function getRefundPreview(orderId: string, itemId: string, signal?: AbortSignal): Promise<RefundPreview> {
  return customerRequest("GET", "/api/v1/refund-cases/orders/{order_id}/items/{item_id}/preview", {
    ...withAuthCookies({ signal }),
    path: { order_id: orderId, item_id: itemId },
  });
}

export function listMyRefundCases(signal?: AbortSignal): Promise<RefundCase[]> {
  return customerRequest("GET", "/api/v1/refund-cases/me", withAuthCookies({ signal }));
}

export function requestRefund(orderId: string, itemId: string, amountMinor: number, reason: string): Promise<{ case_id: string; status: string }> {
  return customerRequest("POST", "/api/v1/refund-cases/orders/{order_id}/requests", {
    ...withAuthCookies(),
    path: { order_id: orderId },
    body: { order_item_id: itemId, amount_minor: amountMinor, reason },
  });
}

export const refundQueries = {
  cases: () =>
    queryOptions({
      queryKey: refundKeys.cases(),
      queryFn: ({ signal }) => listMyRefundCases(signal),
      staleTime: 15_000,
    }),
  /** A 409/503 means eligibility can't be checked right now; retrying won't change it. */
  preview: (orderId: string, itemId: string) =>
    queryOptions({
      queryKey: refundKeys.preview(orderId, itemId),
      queryFn: ({ signal }) => getRefundPreview(orderId, itemId, signal),
      retry: false,
      staleTime: 15_000,
    }),
};
