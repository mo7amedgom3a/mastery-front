import { queryOptions } from "@tanstack/react-query";

import type { ApiRequestContext } from "@/lib/api/client";
import {
  customerRequest,
  withAuthCookies,
  type AuthenticatedRequestOptions,
} from "@/lib/api/customers";
import type { PathParams, QueryParams, RequestBody, SuccessResponse } from "@/lib/api/operation-types";

type GetCartOperation = "get_cart_api_v1_cart_get";
type AddCartItemOperation = "add_cart_item_api_v1_cart_items_post";
type UpdateCartItemOperation = "update_cart_item_api_v1_cart_items__cart_item_id__patch";
type QuoteOperation = "checkout_quote_api_v1_checkout_quote_post";
type CreateCheckoutOperation = "create_checkout_session_api_v1_checkout_sessions_post";
type PaymentIntentOperation = "payment_intent_status_api_v1_payments_intents__payment_intent_id__get";
type ReconcileOperation = "reconcile_payment_intent_api_v1_payments_intents__payment_intent_id__reconcile_post";
type ListOrdersOperation = "list_orders_api_v1_orders_get";
type GetOrderOperation = "get_order_api_v1_orders__order_id__get";
type OrderInvoicesOperation = "order_invoices_api_v1_orders__order_id__invoices_get";
type ListEntitlementsOperation = "list_entitlements_api_v1_me_entitlements_get";

export type CartResponse = SuccessResponse<GetCartOperation>;
export type CartLineResponse = NonNullable<CartResponse["lines"]>[number];
export type CartItemRequest = RequestBody<AddCartItemOperation>;
export type CheckoutQuoteResponse = SuccessResponse<QuoteOperation>;
export type CheckoutSessionRequest = RequestBody<CreateCheckoutOperation>;
export type CheckoutSessionResponse = SuccessResponse<CreateCheckoutOperation>;
export type PaymentIntentStatusResponse = SuccessResponse<PaymentIntentOperation>;
export type OrdersParams = QueryParams<ListOrdersOperation>;
export type OrderPageResponse = SuccessResponse<ListOrdersOperation>;
export type OrderSummaryResponse = OrderPageResponse["items"][number];
export type OrderDetailResponse = SuccessResponse<GetOrderOperation>;
export type OrderLineResponse = NonNullable<OrderDetailResponse["lines"]>[number];
export type OrderTransactionResponse = NonNullable<OrderDetailResponse["transactions"]>[number];
export type OrderInvoiceResponse = SuccessResponse<OrderInvoicesOperation>[number];
export type EntitlementsParams = QueryParams<ListEntitlementsOperation>;
export type EntitlementPageResponse = SuccessResponse<ListEntitlementsOperation>;
export type EntitlementResponse = EntitlementPageResponse["items"][number];

/** Single-product checkout is always charged in USD by the backend; the cart follows suit. */
export const CHECKOUT_CURRENCY = "USD";

const commercePaths = {
  cart: "/api/v1/cart",
  cartItems: "/api/v1/cart/items",
  cartItem: "/api/v1/cart/items/{cart_item_id}",
  quote: "/api/v1/checkout/quote",
  sessions: "/api/v1/checkout/sessions",
  paymentIntent: "/api/v1/payments/intents/{payment_intent_id}",
  reconcile: "/api/v1/payments/intents/{payment_intent_id}/reconcile",
  orders: "/api/v1/orders",
  order: "/api/v1/orders/{order_id}",
  orderInvoices: "/api/v1/orders/{order_id}/invoices",
  entitlements: "/api/v1/me/entitlements",
} as const;

export const commerceKeys = {
  all: ["commerce"] as const,
  cart: () => [...commerceKeys.all, "cart"] as const,
  quote: () => [...commerceKeys.all, "quote"] as const,
  paymentIntent: (id: string) => [...commerceKeys.all, "payment-intent", id] as const,
  orders: (params?: OrdersParams) => [...commerceKeys.all, "orders", params ?? {}] as const,
  order: (id: string) => [...commerceKeys.all, "order", id] as const,
  entitlements: (params?: EntitlementsParams) => [...commerceKeys.all, "entitlements", params ?? {}] as const,
};

export function getCart(options?: AuthenticatedRequestOptions): Promise<CartResponse> {
  return customerRequest<CartResponse>("GET", commercePaths.cart, {
    ...withAuthCookies(options),
    query: { currency_code: CHECKOUT_CURRENCY },
  });
}

/** Sets the line's quantity (the backend replaces, it does not add). */
export function addCartItem(
  productId: CartItemRequest["product_id"],
  quantity: number,
  options?: AuthenticatedRequestOptions,
): Promise<CartResponse> {
  const body: CartItemRequest = { product_id: productId, quantity, currency_code: CHECKOUT_CURRENCY };
  return customerRequest<CartResponse>("POST", commercePaths.cartItems, {
    ...withAuthCookies(options),
    body,
  });
}

export function updateCartItem(
  cartItemId: PathParams<UpdateCartItemOperation>["cart_item_id"],
  quantity: number,
  options?: AuthenticatedRequestOptions,
): Promise<CartResponse> {
  return customerRequest<CartResponse>("PATCH", commercePaths.cartItem, {
    ...withAuthCookies(options),
    path: { cart_item_id: cartItemId },
    body: { quantity },
  });
}

export function removeCartItem(cartItemId: string, options?: AuthenticatedRequestOptions): Promise<void> {
  return customerRequest<void>("DELETE", commercePaths.cartItem, {
    ...withAuthCookies(options),
    path: { cart_item_id: cartItemId },
  });
}

export function quoteCart(options?: AuthenticatedRequestOptions): Promise<CheckoutQuoteResponse> {
  return customerRequest<CheckoutQuoteResponse>("POST", commercePaths.quote, {
    ...withAuthCookies(options),
    query: { currency_code: CHECKOUT_CURRENCY },
  });
}

export function createCheckoutSession(
  body: CheckoutSessionRequest,
  idempotencyKey: string,
  options?: AuthenticatedRequestOptions,
): Promise<CheckoutSessionResponse> {
  return customerRequest<CheckoutSessionResponse>("POST", commercePaths.sessions, {
    ...withAuthCookies(options),
    headers: { "Idempotency-Key": idempotencyKey },
    body,
  });
}

export function getPaymentIntent(
  paymentIntentId: string,
  options?: AuthenticatedRequestOptions,
): Promise<PaymentIntentStatusResponse> {
  return customerRequest<PaymentIntentStatusResponse>("GET", commercePaths.paymentIntent, {
    ...withAuthCookies(options),
    path: { payment_intent_id: paymentIntentId },
  });
}

/** Asks the backend to re-read Stripe now instead of waiting for the webhook. Not proof of payment. */
export function reconcilePayment(
  paymentIntentId: PathParams<ReconcileOperation>["payment_intent_id"],
  options?: AuthenticatedRequestOptions,
): Promise<PaymentIntentStatusResponse> {
  return customerRequest<PaymentIntentStatusResponse>("POST", commercePaths.reconcile, {
    ...withAuthCookies(options),
    path: { payment_intent_id: paymentIntentId },
  });
}

export function listOrders(params?: OrdersParams, options?: AuthenticatedRequestOptions): Promise<OrderPageResponse> {
  return customerRequest<OrderPageResponse>("GET", commercePaths.orders, {
    ...withAuthCookies(options),
    query: params,
  });
}

export function getOrder(orderId: string, options?: AuthenticatedRequestOptions): Promise<OrderDetailResponse> {
  return customerRequest<OrderDetailResponse>("GET", commercePaths.order, {
    ...withAuthCookies(options),
    path: { order_id: orderId },
  });
}

/** Each read signs fresh, short-lived (≈15 min) download links, so call it right before a download. */
export function getOrderInvoices(orderId: string, options?: AuthenticatedRequestOptions): Promise<OrderInvoiceResponse[]> {
  return customerRequest<OrderInvoiceResponse[]>("GET", commercePaths.orderInvoices, {
    ...withAuthCookies(options),
    path: { order_id: orderId },
  });
}

export function listEntitlements(
  params?: EntitlementsParams,
  options?: AuthenticatedRequestOptions,
): Promise<EntitlementPageResponse> {
  return customerRequest<EntitlementPageResponse>("GET", commercePaths.entitlements, {
    ...withAuthCookies(options),
    query: params,
  });
}

export const commerceQueries = {
  cart: (context?: ApiRequestContext) =>
    queryOptions({
      queryKey: commerceKeys.cart(),
      queryFn: ({ signal }) => getCart({ signal, context }),
      staleTime: 15_000,
    }),
  quote: (context?: ApiRequestContext) =>
    queryOptions({
      queryKey: commerceKeys.quote(),
      queryFn: ({ signal }) => quoteCart({ signal, context }),
      staleTime: 0,
    }),
  orders: (params?: OrdersParams, context?: ApiRequestContext) =>
    queryOptions({
      queryKey: commerceKeys.orders(params),
      queryFn: ({ signal }) => listOrders(params, { signal, context }),
      staleTime: 30_000,
    }),
  order: (orderId: string, context?: ApiRequestContext) =>
    queryOptions({
      queryKey: commerceKeys.order(orderId),
      queryFn: ({ signal }) => getOrder(orderId, { signal, context }),
      staleTime: 30_000,
    }),
  entitlements: (params?: EntitlementsParams, context?: ApiRequestContext) =>
    queryOptions({
      queryKey: commerceKeys.entitlements(params),
      queryFn: ({ signal }) => listEntitlements(params, { signal, context }),
      staleTime: 30_000,
    }),
};
