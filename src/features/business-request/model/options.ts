/** Answer choices of the company request. `value` is the code the B2C API accepts. */

export const trainingTypes = [
  { value: "recorded", label: "دورات مسجّلة" },
  { value: "live", label: "تدريب مباشر (أونلاين)" },
  { value: "in_person", label: "دورات حضورية" },
] as const;

export const trainingGoals = [
  { value: "solve_problem", label: "حلّ مشكلة حالية" },
  { value: "employee_performance", label: "رفع أداء الموظفين" },
  { value: "increase_sales", label: "زيادة مبيعات الشركة" },
  { value: "knowledge_skills", label: "تطوير المعرفة واكتساب المهارات" },
  { value: "disclosure_compliance", label: "الامتثال لنظام الإفصاح" },
] as const;

/** `other` asks for the company's own wording, which is sent instead of the code. */
export const industries = [
  { value: "commercial", label: "تجاري" },
  { value: "insurance", label: "تأمين" },
  { value: "banking", label: "بنوك وخدمات مالية" },
  { value: "industrial", label: "صناعي" },
  { value: "technology", label: "تقنية" },
  { value: "healthcare", label: "صحي" },
  { value: "education", label: "تعليمي" },
  { value: "government", label: "حكومي" },
  { value: "real_estate", label: "عقاري ومقاولات" },
  { value: "energy", label: "طاقة" },
  { value: "logistics", label: "نقل ولوجستيات" },
  { value: "other", label: "أخرى" },
] as const;

/** `all` excludes the others; `other` asks for the department names. */
export const departments = [
  { value: "sales", label: "المبيعات" },
  { value: "finance", label: "المالية" },
  { value: "it", label: "تقنية المعلومات" },
  { value: "quality_control", label: "الجودة والرقابة" },
  { value: "top_management", label: "الإدارة العليا" },
  { value: "warehouses", label: "المخازن والمستودعات" },
  { value: "ohs", label: "السلامة والصحة المهنية" },
  { value: "all", label: "جميع الأقسام" },
  { value: "other", label: "أخرى" },
] as const;

export const platforms = [
  { value: "coursera", label: "Coursera" },
  { value: "udemy", label: "Udemy" },
  { value: "linkedin_learning", label: "LinkedIn Learning" },
  { value: "edraak", label: "إدراك" },
  { value: "rwaq", label: "رواق" },
  { value: "doroob", label: "دروب" },
  { value: "internal_lms", label: "منصة تدريب داخلية (LMS)" },
  { value: "other", label: "أخرى" },
] as const;

export const budgetChoices = [
  { value: true, label: "نعم، لدينا ميزانية سنوية مخصّصة للتدريب" },
  { value: false, label: "لا توجد لدينا ميزانية مخصّصة، وعادةً ما نحدّدها حسب الاحتياج" },
] as const;

export type TrainingType = (typeof trainingTypes)[number]["value"];
export type TrainingGoal = (typeof trainingGoals)[number]["value"];
export type Industry = (typeof industries)[number]["value"];
export type Department = (typeof departments)[number]["value"];
export type Platform = (typeof platforms)[number]["value"];

export const valuesOf = <T extends { value: string }>(list: readonly T[]) => list.map((item) => item.value) as [T["value"], ...T["value"][]];

/** Picking "all" clears the other departments; picking another one clears "all". */
export function toggleDepartment(list: readonly Department[], value: Department): Department[] {
  if (list.includes(value)) return list.filter((item) => item !== value);
  if (value === "all") return ["all"];
  return [...list.filter((item) => item !== "all"), value];
}
