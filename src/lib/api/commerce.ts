import { queryOptions } from "@tanstack/react-query";

import { apiRequest, type ApiRequestContext, type ApiRequestOptions } from "@/lib/api/client";
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
type ProductQuoteOperation = "product_quote_api_v1_checkout_product_quote_post";
type MyVouchersOperation = "my_vouchers_api_v1_me_vouchers_get";
type CreateCheckoutOperation = "create_checkout_session_api_v1_checkout_sessions_post";
type FreeEnrollmentOperation = "create_free_enrollment_api_v1_checkout_free_enrollments_post";
type PaymentIntentOperation = "payment_intent_status_api_v1_payments_intents__payment_intent_id__get";
type ReconcileOperation = "reconcile_payment_intent_api_v1_payments_intents__payment_intent_id__reconcile_post";
type TamaraOptionsOperation = "tamara_payment_options_api_v1_payments_tamara_options_get";
type ListOrdersOperation = "list_orders_api_v1_orders_get";
type GetOrderOperation = "get_order_api_v1_orders__order_id__get";
type OrderInvoicesOperation = "order_invoices_api_v1_orders__order_id__invoices_get";
type ListEntitlementsOperation = "list_entitlements_api_v1_me_entitlements_get";
type ListOwnedProductsOperation = "list_owned_products_api_v1_me_products_get";
type ExtensionOptionsOperation = "extension_options_api_v1_me_entitlements__entitlement_id__extension_options_get";
type ExtensionCheckoutOperation = "access_extension_checkout_api_v1_access_extensions_checkout_post";

export type CartResponse = SuccessResponse<GetCartOperation>;
export type CartLineResponse = NonNullable<CartResponse["lines"]>[number];
export type CartItemRequest = RequestBody<AddCartItemOperation>;
export type CheckoutQuoteResponse = SuccessResponse<QuoteOperation>;
export type ProductQuoteRequest = RequestBody<ProductQuoteOperation>;
export type ProductQuoteResponse = SuccessResponse<ProductQuoteOperation>;
export type MyVoucherPageResponse = SuccessResponse<MyVouchersOperation>;
export type MyVoucherResponse = MyVoucherPageResponse["items"][number];
export type QuotedVoucherResponse = CheckoutQuoteResponse["available_vouchers"] extends (infer V)[] | undefined ? V : never;
/** The coupon and vouchers to price an order with (sent to the quote and to checkout). */
export type CheckoutIncentives = { coupon_code?: string | null; voucher_ids?: string[] | null };
export type CheckoutSessionRequest = RequestBody<CreateCheckoutOperation>;
export type CheckoutSessionResponse = SuccessResponse<CreateCheckoutOperation>;
export type FreeEnrollmentResponse = SuccessResponse<FreeEnrollmentOperation>;
export type PaymentIntentStatusResponse = SuccessResponse<PaymentIntentOperation>;
export type TamaraOptionsParams = QueryParams<TamaraOptionsOperation>;
export type TamaraOptionsResponse = SuccessResponse<TamaraOptionsOperation>;
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
export type OwnedProductsParams = QueryParams<ListOwnedProductsOperation>;
export type OwnedProductPageResponse = SuccessResponse<ListOwnedProductsOperation>;
export type OwnedProductResponse = OwnedProductPageResponse["items"][number];
export type ExtensionOptionResponse = SuccessResponse<ExtensionOptionsOperation>[number];
export type ExtensionCheckoutRequest = RequestBody<ExtensionCheckoutOperation>;

/** Single-product checkout is always charged in USD by the backend; the cart follows suit. */
export const CHECKOUT_CURRENCY = "USD";

const commercePaths = {
  cart: "/api/v1/cart",
  cartItems: "/api/v1/cart/items",
  cartItem: "/api/v1/cart/items/{cart_item_id}",
  quote: "/api/v1/checkout/quote",
  productQuote: "/api/v1/checkout/product-quote",
  myVouchers: "/api/v1/me/vouchers",
  sessions: "/api/v1/checkout/sessions",
  freeEnrollments: "/api/v1/checkout/free-enrollments",
  paymentIntent: "/api/v1/payments/intents/{payment_intent_id}",
  reconcile: "/api/v1/payments/intents/{payment_intent_id}/reconcile",
  tamaraOptions: "/api/v1/payments/tamara/options",
  orders: "/api/v1/orders",
  order: "/api/v1/orders/{order_id}",
  orderInvoices: "/api/v1/orders/{order_id}/invoices",
  entitlements: "/api/v1/me/entitlements",
  ownedProducts: "/api/v1/me/products",
  extensionOptions: "/api/v1/me/entitlements/{entitlement_id}/extension-options",
  extensionCheckout: "/api/v1/access-extensions/checkout",
} as const;

export const commerceKeys = {
  all: ["commerce"] as const,
  cart: () => [...commerceKeys.all, "cart"] as const,
  quote: (incentives?: CheckoutIncentives) =>
    incentives ? ([...commerceKeys.all, "quote", incentives] as const) : ([...commerceKeys.all, "quote"] as const),
  productQuote: (body: ProductQuoteRequest) => [...commerceKeys.all, "product-quote", body] as const,
  myVouchers: () => [...commerceKeys.all, "my-vouchers"] as const,
  paymentIntent: (id: string) => [...commerceKeys.all, "payment-intent", id] as const,
  tamaraOptions: (amountMinor: number) => [...commerceKeys.all, "tamara-options", amountMinor] as const,
  orders: (params?: OrdersParams) => [...commerceKeys.all, "orders", params ?? {}] as const,
  order: (id: string) => [...commerceKeys.all, "order", id] as const,
  entitlements: (params?: EntitlementsParams) => [...commerceKeys.all, "entitlements", params ?? {}] as const,
  ownedProducts: (params?: OwnedProductsParams) => [...commerceKeys.all, "owned-products", params ?? {}] as const,
  extensionOptions: (entitlementId: string) => [...commerceKeys.all, "extension-options", entitlementId] as const,
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

function incentivesBody(incentives?: CheckoutIncentives): CheckoutIncentives | undefined {
  const coupon_code = incentives?.coupon_code?.trim() || null;
  const voucher_ids = incentives?.voucher_ids?.length ? incentives.voucher_ids : null;
  return coupon_code || voucher_ids ? { coupon_code, voucher_ids } : undefined;
}

/** Cart totals; `incentives` previews a coupon and vouchers (a rejected coupon comes back in `coupon.status`). */
export function quoteCart(
  options?: AuthenticatedRequestOptions,
  incentives?: CheckoutIncentives,
): Promise<CheckoutQuoteResponse> {
  const body = incentivesBody(incentives);
  return customerRequest<CheckoutQuoteResponse>("POST", commercePaths.quote, {
    ...withAuthCookies(options),
    query: { currency_code: CHECKOUT_CURRENCY },
    ...(body ? { body } : {}),
  });
}

/** The customer's vouchers (store credit), newest first, with balance and status. */
export function listMyVouchers(options?: AuthenticatedRequestOptions): Promise<MyVoucherPageResponse> {
  return customerRequest<MyVoucherPageResponse>("GET", commercePaths.myVouchers, {
    ...withAuthCookies(options),
    query: { limit: 100 },
  });
}

/** Buy-now totals for one product with an optional coupon and vouchers. */
export function quoteProduct(body: ProductQuoteRequest, options?: AuthenticatedRequestOptions): Promise<ProductQuoteResponse> {
  return customerRequest<ProductQuoteResponse>("POST", commercePaths.productQuote, {
    ...withAuthCookies(options),
    body: { ...body, ...incentivesBody(body) },
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

/**
 * Enrolls in a zero-priced product: the backend creates a paid 0.00 order, its invoice and the
 * access right away, with no payment step. Refused with `product_not_free` if the price is not 0.
 */
export function enrollFree(
  productId: RequestBody<FreeEnrollmentOperation>["product_id"],
  idempotencyKey: string,
  options?: AuthenticatedRequestOptions,
): Promise<FreeEnrollmentResponse> {
  return customerRequest<FreeEnrollmentResponse>("POST", commercePaths.freeEnrollments, {
    ...withAuthCookies(options),
    headers: { "Idempotency-Key": idempotencyKey },
    body: { product_id: productId },
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

/**
 * Public: whether Tamara accepts this amount (catalog USD cents), the amount in Tamara's currency
 * (AED), the instalment plans and the widget's public key.
 */
export function getTamaraOptions(params: TamaraOptionsParams, options?: ApiRequestOptions): Promise<TamaraOptionsResponse> {
  // In the browser read it through this app (`/api/b2c`): `API_BASE_URL` is server-only, so a
  // direct call would fall back to `localhost:8000` in the client bundle.
  const viaApp = typeof window !== "undefined" ? { sameOrigin: true as const } : {};
  return apiRequest<TamaraOptionsResponse>("GET", commercePaths.tamaraOptions, { ...options, ...viaApp, query: params });
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

/** Products the customer bought, one row per product (its best entitlement). */
export function listOwnedProducts(
  params?: OwnedProductsParams,
  options?: AuthenticatedRequestOptions,
): Promise<OwnedProductPageResponse> {
  return customerRequest<OwnedProductPageResponse>("GET", commercePaths.ownedProducts, {
    ...withAuthCookies(options),
    query: params,
  });
}

/** Ways to buy more access time for one entitlement; `eligible: false` options say why in `reason`. */
export function listExtensionOptions(
  entitlementId: string,
  options?: AuthenticatedRequestOptions,
): Promise<ExtensionOptionResponse[]> {
  return customerRequest<ExtensionOptionResponse[]>("GET", commercePaths.extensionOptions, {
    ...withAuthCookies(options),
    path: { entitlement_id: entitlementId },
  });
}

/** A Stripe Checkout session for an access extension; the paid order moves the expiry forward. */
export function startExtensionCheckout(
  body: ExtensionCheckoutRequest,
  idempotencyKey: string,
  options?: AuthenticatedRequestOptions,
): Promise<CheckoutSessionResponse> {
  return customerRequest<CheckoutSessionResponse>("POST", commercePaths.extensionCheckout, {
    ...withAuthCookies(options),
    headers: { "Idempotency-Key": idempotencyKey },
    body,
  });
}

export const commerceQueries = {
  cart: (context?: ApiRequestContext) =>
    queryOptions({
      queryKey: commerceKeys.cart(),
      queryFn: ({ signal }) => getCart({ signal, context }),
      staleTime: 15_000,
    }),
  quote: (context?: ApiRequestContext, incentives?: CheckoutIncentives) =>
    queryOptions({
      queryKey: commerceKeys.quote(incentives),
      queryFn: ({ signal }) => quoteCart({ signal, context }, incentives),
      staleTime: 0,
    }),
  myVouchers: () =>
    queryOptions({ queryKey: commerceKeys.myVouchers(), queryFn: ({ signal }) => listMyVouchers({ signal }) }),
  productQuote: (body: ProductQuoteRequest) =>
    queryOptions({
      queryKey: commerceKeys.productQuote(body),
      queryFn: ({ signal }) => quoteProduct(body, { signal }),
      staleTime: 0,
    }),
  /** Keyed by the amount, so eligibility and the widget follow every cart change. */
  tamaraOptions: (amountMinor: number) =>
    queryOptions({
      queryKey: commerceKeys.tamaraOptions(amountMinor),
      queryFn: ({ signal }) => getTamaraOptions({ amount_minor: amountMinor, currency_code: CHECKOUT_CURRENCY }, { signal }),
      staleTime: 5 * 60_000,
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
  ownedProducts: (params?: OwnedProductsParams, context?: ApiRequestContext) =>
    queryOptions({
      queryKey: commerceKeys.ownedProducts(params),
      queryFn: ({ signal }) => listOwnedProducts(params, { signal, context }),
      staleTime: 30_000,
    }),
  extensionOptions: (entitlementId: string) =>
    queryOptions({
      queryKey: commerceKeys.extensionOptions(entitlementId),
      queryFn: ({ signal }) => listExtensionOptions(entitlementId, { signal }),
      staleTime: 60_000,
    }),
};
