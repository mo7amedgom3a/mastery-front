/**
 * «نقطة» (Nuqta): the fictional Riyadh B2B SaaS that every company-journey lab follows, from
 * registration to governance, the forecast, the quarter close, a data incident and an acquisition.
 * One source of truth for names, the cap table and the figures the labs quote.
 */
import type { Persona } from "../../model/dialogue";
import type { JourneySlug } from "../../model/types";

export const company = {
  name: "نقطة",
  legalName: "شركة نقطة للحلول التقنية",
  latinName: "Nuqta Technology Solutions",
  tagline: "إدارة المخزون للمقاهي ومتاجر التجزئة",
  city: "الرياض",
  district: "حي الملقا",
  activity: "تطوير ونشر البرمجيات كخدمة (SaaS) · ISIC 620101",
  capital: 500_000,
  fiscalYear: "يناير – ديسمبر",
} as const;

export type Partner = { id: string; name: string; role: string; nationality: string; share: number; cash: number };

/** Cap table at formation: the foreign 30% is what puts the company on the MISA path. */
export const partners: readonly Partner[] = [
  { id: "faisal", name: "فيصل الدوسري", role: "الشريك المؤسس · الرئيس التنفيذي", nationality: "سعودي", share: 45, cash: 225_000 },
  { id: "reem", name: "ريم الشهري", role: "الشريكة المؤسسة · المديرة التقنية", nationality: "سعودية", share: 25, cash: 125_000 },
  { id: "karim", name: "كريم منصور", role: "شريك مستثمر", nationality: "مصري", share: 30, cash: 150_000 },
];

/** The cast, shared by every lab's dialogue graphs. */
export const people = {
  faisal: { name: "فيصل الدوسري", role: "الرئيس التنفيذي والشريك المؤسس", initials: "فد", tone: "sky" },
  reem: { name: "ريم الشهري", role: "المديرة التقنية والشريكة المؤسسة", initials: "رش", tone: "purple" },
  karim: { name: "كريم منصور", role: "شريك مستثمر · عضو مجلس", initials: "كم", tone: "yellow" },
  huda: { name: "د. هدى العمري", role: "عضوة مجلس مستقلة · رئيسة لجنة المراجعة", initials: "هع", tone: "teal" },
  omar: { name: "عمر باحارث", role: "ممثل صندوق «رواد» الاستثماري", initials: "عب", tone: "coral" },
  salem: { name: "سالم القرني", role: "موظف مركز الأعمال", initials: "سق", tone: "green" },
  lama: { name: "لمى الحربي", role: "المديرة المالية", initials: "لح", tone: "pink" },
  auditor: { name: "أ. ماجد السبيعي", role: "شريك المراجعة الخارجية", initials: "مس", tone: "teal" },
  journalist: { name: "نوف الزهراني", role: "صحفية تقنية", initials: "نز", tone: "coral" },
} as const satisfies Record<string, Persona>;

/** Monthly figures at the start of the forecast (month 0, SAR). */
export const baseline = {
  customers: 180,
  arpa: 690,
  cash: 3_400_000,
  headcount: 14,
  avgSalary: 19_000,
  officeAndTools: 46_000,
} as const;

/** The journey order shown on the hub and the "previous step" line in each briefing. */
export const journey: readonly { slug: JourneySlug; step: string; short: string }[] = [
  { slug: "startup-company-registration", step: "1", short: "التأسيس" },
  { slug: "governance-first-board", step: "2", short: "الحوكمة" },
  { slug: "cfo-forecast-runway", step: "3", short: "التنبؤ والمدرج" },
  { slug: "finance-quarter-close", step: "4", short: "إقفال الربع" },
  { slug: "crisis-data-leak", step: "5", short: "الأزمة" },
  { slug: "audit-escape-room", step: "6", short: "غرفة التدقيق" },
];

/** Thousands-separated SAR amount with Latin digits, as on Saudi statements. */
export function money(amount: number, unit = "ر.س"): string {
  return `${Math.round(amount).toLocaleString("en-US")} ${unit}`;
}

/** "1.4M" / "820K" for tight cells. */
export function compact(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "−" : "";
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 2)}M`;
  if (abs >= 1_000) return `${sign}${Math.round(abs / 1_000)}K`;
  return `${sign}${Math.round(abs)}`;
}
