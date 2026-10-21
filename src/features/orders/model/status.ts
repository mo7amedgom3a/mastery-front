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
  partially_refunded: { label: "مسترد جزئياً", tag: "ma-tag--sky" },
  refunded: { label: "مسترد", tag: "ma-tag--sky" },
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

// Gateway-side states (pending, requires_action, needs_reconciliation) all read as "in progress" to the customer.
const refundCaseStatuses: Record<string, StatusView> = {
  requested: { label: "قيد المراجعة", tag: "ma-tag--yellow" },
  processing: { label: "تمت الموافقة · جارٍ التنفيذ", tag: "ma-tag--sky" },
  pending: { label: "تمت الموافقة · جارٍ التنفيذ", tag: "ma-tag--sky" },
  requires_action: { label: "تمت الموافقة · جارٍ التنفيذ", tag: "ma-tag--sky" },
  needs_reconciliation: { label: "تمت الموافقة · جارٍ التنفيذ", tag: "ma-tag--sky" },
  succeeded: { label: "تم الاسترداد", tag: "ma-tag--green" },
  rejected: { label: "مرفوض", tag: "ma-tag--pink" },
  failed: { label: "تعذّر التنفيذ", tag: "ma-tag--pink" },
  canceled: { label: "ملغى", tag: NEUTRAL },
};

/** Why an item can't be refunded, in the customer's words. Unknown codes fall back to a generic line. */
const refundReasons: Record<string, string> = {
  open_request_exists: "لديك طلب استرداد قيد المراجعة لهذا المنتج.",
  outside_30_day_window: "انتهت مهلة طلب الاسترداد (30 يومًا من الشراء).",
  payment_not_captured: "لم يكتمل الدفع بعد.",
  learning_started: "بدأت التعلم في هذا المنتج، لذا لم يعد قابلًا للاسترداد.",
  subscription_period_ended: "انتهت فترة الاشتراك المدفوعة.",
  subscription_period_missing: "تعذّر تحديد فترة الاشتراك.",
  consultation_not_provider_failed: "الاستشارة غير مؤهلة للاسترداد وفق سياسة الخدمة.",
  customer_cancelled_or_missed: "إلغاء الاستشارة أو التغيب عنها لا يؤهل للاسترداد.",
  fully_refunded_or_reserved: "تم استرداد المبلغ بالكامل أو هناك عملية استرداد قيد التنفيذ.",
  resource_mapping_missing: "لا يمكن طلب الاسترداد إلكترونيًا لهذا المنتج. تواصل مع الدعم.",
  unallocated_existing_refund: "توجد عملية استرداد سابقة على هذا الطلب. تواصل مع الدعم.",
};

const transactionEvents: Record<string, string> = {
  "checkout.session.completed": "اكتملت عملية الدفع",
  "checkout.session.expired": "انتهت مهلة صفحة الدفع",
  "payment_intent.payment_failed": "رُفضت عملية الدفع",
  "stripe.checkout_session.reconciled": "تأكيد الدفع من Stripe",
  // Tamara: the backend records `tamara.order.<status>` each time it re-reads the order.
  "tamara.order.new": "بدء الدفع عبر تمارا",
  "tamara.order.approved": "وافقت تمارا على الطلب",
  "tamara.order.authorised": "تأكيد الطلب لدى تمارا",
  "tamara.order.partially_captured": "تحصيل جزء من المبلغ عبر تمارا",
  "tamara.order.fully_captured": "اكتمل الدفع عبر تمارا",
  "tamara.order.declined": "رفضت تمارا الطلب",
  "tamara.order.expired": "انتهت مهلة صفحة تمارا",
  "tamara.order.canceled": "أُلغي الطلب لدى تمارا",
  "tamara.order.partially_refunded": "استرداد جزئي عبر تمارا",
  "tamara.order.fully_refunded": "استرداد كامل عبر تمارا",
};

function view(map: Record<string, StatusView>, status: string | null | undefined): StatusView {
  if (!status) return { label: "—", tag: NEUTRAL };
  return map[status] ?? { label: status, tag: NEUTRAL };
}

export const orderStatus = (status: string) => view(orderStatuses, status);
export const paymentStatus = (status: string | null | undefined) => view(paymentStatuses, status);
export const entitlementStatus = (status: string) => view(entitlementStatuses, status);
export const fulfillmentStatus = (status: string | null | undefined) => view(fulfillmentStatuses, status);
export const refundCaseStatus = (status: string) => view(refundCaseStatuses, status);
export const refundReason = (code: string) => refundReasons[code] ?? "هذا المنتج غير مؤهل للاسترداد حاليًا.";
export const transactionEvent = (eventType: string) => transactionEvents[eventType] ?? eventType;

/** Payment states that will not change any more. */
export function isPaymentSettled(status: string): boolean {
  return status === "succeeded" || status === "failed" || status === "cancelled" || status.endsWith("refunded");
}

/** Short reference shown to the customer: the first block of the order UUID. */
export function orderNumber(orderId: string): string {
  return orderId.split("-")[0].toUpperCase();
}
