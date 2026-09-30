import type { NextRequest } from "next/server";

import { isMockCheckoutEnabled } from "@/config/env";
import { confirmSchema } from "@/features/cart/api/quote";
import { readBody, shopError, shopJson } from "@/features/cart/api/respond";
import type { PaymentConfirmResponse } from "@/lib/shop/contract";

/**
 * MOCK: the stand-in for a payment provider's answer. The mock gateway page reports the outcome the
 * tester picked and gets the order's new status back. Nothing is stored and no money moves.
 * TODO(api): real providers answer through signed webhooks to the backend, never through the browser.
 */
export async function POST(request: NextRequest) {
  if (!isMockCheckoutEnabled()) {
    return shopError(503, "checkout_unavailable", "الدفع الإلكتروني غير متاح بعد.");
  }
  const body = await readBody(request, confirmSchema);
  if ("error" in body) return body.error;
  const paid = body.data.outcome === "success";
  const response: PaymentConfirmResponse = {
    orderId: body.data.orderId,
    status: paid ? "paid" : "failed",
    paidAt: paid ? new Date().toISOString() : null,
  };
  return shopJson(response);
}
