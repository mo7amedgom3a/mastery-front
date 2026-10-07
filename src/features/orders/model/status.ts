/**
 * Arabic labels and tag colours for the statuses the backend reports. The API sends plain strings;
 * anything not listed here still shows, under a neutral tag, rather than disappearing.
 */

export type StatusView = { label: string; tag: string };

const NEUTRAL = "ma-tag--soft";

const orderStatuses: Record<string, StatusView> = {
  pending_payment: { label: "بانتظار الدفع", tag: "ma-tag--yellow" },
  paid: { label: "مدفوع", tag: "ma-tag--green" },
  payment_failed: { label: "فشل الدفع", tag: "ma-tag--pink" },
  cancelled: { label: "ملغى", tag: NEUTRAL },
};

const paymentStatuses: Record<string, StatusView> = {
  created: { label: "قيد الإنشاء", tag: NEUTRAL },
  pending: { label: "قيد المعالجة", tag: "ma-tag--yellow" },
  requires_action: { label: "بانتظار إجراء منك", tag: "ma-tag--yellow" },
  processing: { label: "قيد المعالجة", tag: "ma-tag--yellow" },
  succeeded: { label: "تم الدفع", tag: "ma-tag--green" },
  failed: { label: "فشل", tag: "ma-tag--pink" },
  cancelled: { label: "ملغى", tag: NEUTRAL },
  partially_refunded: { label: "مسترد جزئياً", tag: "ma-tag--sky" },
  refunded: { label: "مسترد", tag: "ma-tag--sky" },
};

const entitlementStatuses: Record<string, StatusView> = {
  active: { label: "فعّال", tag: "ma-tag--green" },
  expired: { label: "منتهي", tag: NEUTRAL },
  revoked: { label: "ملغى", tag: "ma-tag--pink" },
  suspended: { label: "موقوف", tag: "ma-tag--yellow" },
};

const fulfillmentStatuses: Record<string, StatusView> = {
  pending: { label: "قيد التفعيل", tag: "ma-tag--yellow" },
  processing: { label: "قيد التفعيل", tag: "ma-tag--yellow" },
  fulfilled: { label: "مفعّل", tag: "ma-tag--green" },
  completed: { label: "مفعّل", tag: "ma-tag--green" },
  failed: { label: "تعذّر التفعيل", tag: "ma-tag--pink" },
};

const transactionEvents: Record<string, string> = {
  "checkout.session.completed": "اكتملت عملية الدفع",
  "checkout.session.expired": "انتهت مهلة صفحة الدفع",
  "payment_intent.payment_failed": "رُفضت عملية الدفع",
  "stripe.checkout_session.reconciled": "تأكيد الدفع من Stripe",
};

function view(map: Record<string, StatusView>, status: string | null | undefined): StatusView {
  if (!status) return { label: "—", tag: NEUTRAL };
  return map[status] ?? { label: status, tag: NEUTRAL };
}

export const orderStatus = (status: string) => view(orderStatuses, status);
export const paymentStatus = (status: string | null | undefined) => view(paymentStatuses, status);
export const entitlementStatus = (status: string) => view(entitlementStatuses, status);
export const fulfillmentStatus = (status: string | null | undefined) => view(fulfillmentStatuses, status);
export const transactionEvent = (eventType: string) => transactionEvents[eventType] ?? eventType;

/** Payment states that will not change any more. */
export function isPaymentSettled(status: string): boolean {
  return status === "succeeded" || status === "failed" || status === "cancelled" || status.endsWith("refunded");
}

/** Short reference shown to the customer: the first block of the order UUID. */
export function orderNumber(orderId: string): string {
  return orderId.split("-")[0].toUpperCase();
}
