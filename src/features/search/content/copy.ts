import type { ArabicCountForms } from "@/lib/format";

import type { ProductType, SearchSort } from "../model/params";

/** Chip and heading labels for each product type. */
export const typeLabel: Record<ProductType, { plural: string; definite: string }> = {
  course: { plural: "دورات", definite: "الدورات" },
  diploma: { plural: "دبلومات", definite: "الدبلومات" },
  package: { plural: "باقات", definite: "الباقات" },
  consultation: { plural: "استشارات", definite: "الاستشارات" },
};

/** The default order when there is no query to rank by. */
export const NEWEST_LABEL = "الأحدث";

export const sortLabel: Record<SearchSort, string> = {
  relevance: "الأكثر صلة",
  price_asc: "السعر: من الأقل",
  price_desc: "السعر: من الأعلى",
  duration_asc: "المدة: الأقصر أولاً",
  duration_desc: "المدة: الأطول أولاً",
};

export const RESULT_FORMS: ArabicCountForms = {
  one: "نتيجة واحدة",
  two: "نتيجتان",
  few: "نتائج",
  many: "نتيجة",
};

export const searchCopy = {
  pageTitle: "تصفّح كل برامج ماستري",
  lead: "دورات ودبلومات وباقات واستشارات في مكان واحد. ابحث بكلماتك، ثم ضيّق النتائج بالمجال والمهارة والمدرّب والسعر.",
  placeholder: "ماذا تريد أن تتعلّم؟ مثال: التسويق عبر وسائل التواصل",
  submit: "ابحث",
  smart: "بحث ذكي",
  smartHint: "يفهم معنى ما تكتبه، لا الكلمات نفسها فقط.",
  description:
    "تصفّح دورات ودبلومات وباقات واستشارات ماستري أكاديمي في التسويق والإدارة والمبيعات والمالية والذكاء الاصطناعي، وابحث بالمجال والمهارة والمدرّب والسعر.",
} as const;

/**
 * Arabic names for the catalog's tags and skills, which the API stores in English. Unknown codes
 * fall back to the API's own name, so a new tag still shows up (in English) until it is added here.
 */
const tagLabel: Record<string, string> = {
  ai: "الذكاء الاصطناعي",
  consultation: "استشارات",
  "consumer-behavior": "سلوك المستهلك",
  "customer-service": "خدمة العملاء",
  "data-analysis": "تحليل البيانات",
  "digital-marketing": "التسويق الرقمي",
  ecommerce: "التجارة الإلكترونية",
  entrepreneurship: "ريادة الأعمال",
  excel: "إكسل",
  finance: "المالية",
  leadership: "القيادة",
  management: "الإدارة",
  marketing: "التسويق",
  procurement: "المشتريات",
  sales: "المبيعات",
  "social-media": "وسائل التواصل الاجتماعي",
  "supply-chain": "سلاسل الإمداد",
  warehouse: "إدارة المخازن",
};

const skillLabel: Record<string, string> = {
  "finance/accounting": "المحاسبة",
  "programming/backend/api": "تصميم الواجهات البرمجية",
  "technology/ai": "الذكاء الاصطناعي",
  technology: "التقنية",
  "programming/backend": "تطوير الخوادم",
  "marketing/branding": "بناء العلامة التجارية",
  business: "الأعمال",
  "business/strategy": "استراتيجية الأعمال",
  "communication/business-writing": "الكتابة المهنية",
  communication: "التواصل",
  "marketing/consumer-behavior": "سلوك المستهلك",
  "marketing/content-marketing": "التسويق بالمحتوى",
  "business/customer-service": "خدمة العملاء",
  data: "البيانات",
  "data/analysis": "تحليل البيانات",
  "programming/backend/databases": "قواعد البيانات",
  "marketing/digital-marketing": "التسويق الرقمي",
  "marketing/ecommerce": "التجارة الإلكترونية",
  "business/entrepreneurship": "ريادة الأعمال",
  "data/excel": "إكسل",
  finance: "المالية",
  "finance/financial-management": "الإدارة المالية",
  "programming/frontend": "تطوير الواجهات",
  "business/hr": "الموارد البشرية",
  "data/kpi": "مؤشرات الأداء",
  "business/leadership": "القيادة",
  "business/management": "الإدارة",
  "marketing/market-research": "أبحاث السوق",
  marketing: "التسويق",
  "communication/negotiation": "التفاوض",
  operations: "العمليات",
  "communication/presentation": "مهارات العرض والتقديم",
  "operations/procurement": "المشتريات",
  programming: "البرمجة",
  "business/project-management": "إدارة المشاريع",
  "programming/backend/python": "بايثون",
  "operations/quality": "إدارة الجودة",
  "programming/backend/rest": "واجهات REST",
  "marketing/sales": "المبيعات",
  "marketing/social-media": "التسويق عبر وسائل التواصل",
  "operations/supply-chain": "سلاسل الإمداد",
  "operations/warehouse-management": "إدارة المخازن",
};

export function tagName(code: string, fallback: string = code): string {
  return tagLabel[code.toLowerCase()] ?? fallback;
}

export function skillName(code: string, fallback: string = code): string {
  return skillLabel[code.toLowerCase()] ?? fallback;
}
