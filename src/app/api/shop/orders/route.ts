import type { NextRequest } from "next/server";

import { isMockCheckoutEnabled } from "@/config/env";
import { getQuote, orderSchema } from "@/features/cart/api/quote";
import { catalogUnavailable, readBody, shopError, shopJson } from "@/features/cart/api/respond";
import type { Order, OrderResponse, Quote } from "@/lib/shop/contract";

const SESSION_COOKIES = ["b2c_access_token", "b2c_refresh_token"];

/**
 * MOCK: places an order for the cart and says how to pay for it. Nothing is stored and no money
 * moves: the order goes back to the browser, and "payment" is the stand-in page at
 * `/checkout/mock-gateway`. Off unless mock checkout is enabled (see `isMockCheckoutEnabled`).
 *
 * The cart is re-priced here; an order is refused when its total differs from what the customer saw.
 * TODO(api): replace with the backend's checkout (`b2c.orders`, `b2c.payments`) and the providers'
 * hosted pages; the session check below then happens on the backend.
 */
export async function POST(request: NextRequest) {
  if (!isMockCheckoutEnabled()) {
    return shopError(503, "checkout_unavailable", "الدفع الإلكتروني غير متاح بعد.");
  }
  const body = await readBody(request, orderSchema);
  if ("error" in body) return body.error;
  const { paymentMethod, expectedTotal, mockCustomer, ...cart } = body.data;

  // A cookie's presence is all this mock checks; `mockCustomer` stands in while sign-in isn't built.
  const signedIn = SESSION_COOKIES.some((name) => request.cookies.has(name));
  if (!signedIn && !mockCustomer) {
    return shopError(401, "auth_required", "سجّل الدخول لإتمام الطلب.");
  }

  let quote: Quote;
  try {
    quote = await getQuote(cart);
  } catch (error) {
    return catalogUnavailable(error);
  }
  if (quote.lines.length === 0) {
    return shopError(400, "empty_cart", "لا توجد منتجات قابلة للشراء في سلتك.");
  }
  if (Math.round(quote.totals.total * 100) !== Math.round(expectedTotal * 100)) {
    return shopError(409, "price_changed", "تغيّرت الأسعار منذ آخر تحديث. راجع الإجمالي الجديد ثم أكمل الدفع.", quote);
  }

  const free = quote.totals.total === 0;
  // Apple Pay's device check happens in the browser; the order only checks the amount limits.
  if (!free && !quote.paymentMethods.some((method) => method.id === paymentMethod && method.eligible)) {
    return shopError(400, "payment_method_unavailable", "اختر طريقة دفع متاحة لهذا الطلب.");
  }

  const orderId = crypto.randomUUID();
  const now = new Date().toISOString();
  const order: Order = {
    orderId,
    number: `MA-${orderId.slice(0, 8).toUpperCase()}`,
    status: free ? "paid" : "pending_payment",
    createdAt: now,
    paidAt: free ? now : null,
    paymentMethod: free ? null : paymentMethod,
    couponCode: quote.coupon?.status === "applied" ? quote.coupon.code : null,
    lines: quote.lines.map((line) => ({
      key: line.key,
      kind: line.item.kind,
      title: line.item.title,
      href: line.item.href,
      image: line.item.image,
      unitAmount: line.unitAmount,
      originalAmount: line.originalAmount,
      addons: line.addons
        .filter((addon) => addon.selected)
        .map(({ code, title, amount }) => ({ code, title, amount })),
      discountAmount: line.discountAmount,
      totalAmount: line.totalAmount,
    })),
    totals: quote.totals,
  };

  const response: OrderResponse = {
    order,
    payment: free ? { action: "none" } : { action: "redirect", url: `/checkout/mock-gateway?order=${orderId}` },
  };
  return shopJson(response, 201);
}
