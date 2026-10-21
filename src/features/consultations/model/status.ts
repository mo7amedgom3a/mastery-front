import type { StatusView } from "@/features/orders/model/status";

/**
 * Arabic labels for the booking lifecycle the backend reports. Unknown statuses still show, under
 * a neutral tag, rather than disappearing.
 */
const bookingStatuses: Record<string, StatusView> = {
  pending_payment: { label: "بانتظار الدفع", tag: "ma-tag--yellow" },
  expired: { label: "انتهت مهلة الدفع", tag: "ma-tag--soft" },
  awaiting_approval: { label: "بانتظار تأكيد الخبير", tag: "ma-tag--yellow" },
  confirmed: { label: "مؤكّدة", tag: "ma-tag--green" },
  in_progress: { label: "جارية الآن", tag: "ma-tag--sky" },
  completed: { label: "مكتملة", tag: "ma-tag--green" },
  rejected: { label: "مرفوضة", tag: "ma-tag--pink" },
  refund_pending: { label: "قيد الاسترداد", tag: "ma-tag--sky" },
  refunded: { label: "تم الاسترداد", tag: "ma-tag--sky" },
  no_show_customer: { label: "لم يحضر العميل", tag: "ma-tag--pink" },
  no_show_expert: { label: "لم يحضر الخبير · قيد الاسترداد", tag: "ma-tag--pink" },
  cancelled: { label: "ملغاة", tag: "ma-tag--soft" },
};

export function bookingStatus(status: string): StatusView {
  return bookingStatuses[status] ?? { label: status, tag: "ma-tag--soft" };
}

const UPCOMING = new Set(["awaiting_approval", "confirmed", "in_progress"]);

export function isUpcoming(status: string): boolean {
  return UPCOMING.has(status);
}
