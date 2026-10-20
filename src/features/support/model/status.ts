export type StatusView = { label: string; tag: string };

const NEUTRAL = "ma-tag--soft";

export const ticketStatuses: Record<string, StatusView> = {
  NEW: { label: "جديدة", tag: "ma-tag--yellow" },
  OPEN: { label: "مفتوحة", tag: "ma-tag--sky" },
  IN_PROGRESS: { label: "قيد المتابعة", tag: "ma-tag--yellow" },
  WAITING_FOR_CUSTOMER: { label: "بانتظار ردك", tag: "ma-tag--pink" },
  ON_HOLD: { label: "معلّقة مؤقتاً", tag: NEUTRAL },
  RESOLVED: { label: "تم الحل", tag: "ma-tag--green" },
  CLOSED: { label: "مغلقة", tag: NEUTRAL },
  REOPENED: { label: "أعيد فتحها", tag: "ma-tag--yellow" },
};

export const ticketPriorities: Record<string, StatusView> = {
  LOW: { label: "منخفضة", tag: "ma-tag--soft" },
  MEDIUM: { label: "متوسطة", tag: "ma-tag--sky" },
  HIGH: { label: "عالية", tag: "ma-tag--yellow" },
  URGENT: { label: "عاجلة جداً", tag: "ma-tag--pink" },
};

export function ticketStatus(status: string | null | undefined): StatusView {
  if (!status) return { label: "—", tag: NEUTRAL };
  return ticketStatuses[status] ?? { label: status, tag: NEUTRAL };
}

export function ticketPriority(priority: string | null | undefined): StatusView {
  if (!priority) return { label: "—", tag: NEUTRAL };
  return ticketPriorities[priority] ?? { label: priority, tag: NEUTRAL };
}
