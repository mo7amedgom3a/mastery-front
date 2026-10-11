export const LEVEL_LABELS: Record<string, { label: string; hint: string }> = {
  beginner: { label: "مبتدئ", hint: "أبدأ من الأساسيات" },
  intermediate: { label: "متوسط", hint: "أعرف الأساسيات وأريد التعمّق" },
  advanced: { label: "متقدم", hint: "أبحث عن مستوى احترافي" },
};

export const DEFAULT_LEVELS = ["beginner", "intermediate", "advanced"];

export const DAILY_MINUTES = [15, 30, 60, 90] as const;

const PRODUCT_TYPE_LABELS: Record<string, string> = {
  course: "الدورات",
  diploma: "الدبلومات",
  package: "الباقات",
  bundle: "الحزم",
  consultation: "الاستشارات",
};

const TAG_LABELS: Record<string, string> = {
  consultation: "الاستشارات",
  management: "الإدارة",
  marketing: "التسويق",
  sales: "المبيعات",
  finance: "المالية",
  leadership: "القيادة",
  "digital-marketing": "التسويق الرقمي",
  "customer-service": "خدمة العملاء",
  "data-analysis": "تحليل البيانات",
  procurement: "المشتريات",
  warehouse: "إدارة المخازن",
  "social-media": "التواصل الاجتماعي",
  entrepreneurship: "ريادة الأعمال",
  excel: "Excel",
  "consumer-behavior": "سلوك المستهلك",
  ecommerce: "التجارة الإلكترونية",
  "supply-chain": "سلاسل الإمداد",
  ai: "الذكاء الاصطناعي",
};

/** Arabic label of a product type code; the API's own name for codes we don't know. */
export function productTypeLabel(code: string, fallback?: string): string {
  return PRODUCT_TYPE_LABELS[code] ?? fallback ?? code;
}

/** Arabic label of a product tag; unknown tags are shown as words (`supply-chain` → `supply chain`). */
export function tagLabel(tag: string): string {
  return TAG_LABELS[tag] ?? tag.replace(/[-_]+/g, " ");
}

/** Allowed values of a single-select question (`options_json` is a JSON array of strings). */
export function parseOptions(optionsJson: string | null | undefined): string[] {
  if (!optionsJson) return [];
  try {
    const parsed: unknown = JSON.parse(optionsJson);
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === "string") : [];
  } catch {
    return [];
  }
}
