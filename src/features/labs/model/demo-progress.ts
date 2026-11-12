import type { Attempt } from "./progress-store";
import { useLabsProgress } from "./progress-store";
import type { Skill } from "./types";

/**
 * A ready-made practice history for demos and design reviews. It is written only from the empty
 * state's "show a demo report" action, is labelled as demo data in the UI, and can be cleared with
 * the labs hub's reset button.
 */

const dim = (skill: Skill, label: string, score: number, tip: string, praise: string) => ({
  key: `${skill}-${label}`,
  label,
  score,
  skill,
  tip,
  praise,
});

export const demoAttempts: readonly Attempt[] = [
  {
    id: "demo-marketing-1",
    slug: "marketing-ads",
    at: "2026-10-20T09:00:00.000Z",
    overall: 58,
    readiness: "مبتدئ",
    dimensions: [
      dim("analysis", "اختيار الجمهور", 55, "حدّد الجمهور من سلوك الشراء لا من العمر فقط.", "قرأت السوق قبل الإطلاق."),
      dim("decision", "توزيع الميزانية", 62, "اختبر إعلانين صغيرين قبل التوسع.", "لم تتجاوز الميزانية."),
      dim("execution", "تشغيل الحملة", 48, "راقب التكرار اليومي وأوقف الجمهور الخاسر مبكرًا.", "أطلقت في الوقت."),
    ],
    xp: 166,
    badges: ["first-lab"],
    categoryLegacyId: 27,
    categoryName: "التسويق المتكامل",
    minutes: 14,
    highlights: [
      { at: "اليوم 2", tone: "bad", text: "حرقت 40٪ من الميزانية على جمهور لم يتفاعل خلال أول يومين." },
      { at: "اليوم 5", tone: "info", text: "غيّرت الإعلان في منتصف الحملة فتوقف التعلّم الذي بدأه المحرك." },
    ],
    pre: { percent: 55, style: "assertive" },
    post: { percent: 72, style: "analytical" },
    signals: { marketingTargetMet: false },
    attemptNo: 1,
  },
  {
    id: "demo-marketing-2",
    slug: "marketing-ads",
    at: "2026-11-02T09:00:00.000Z",
    overall: 79,
    readiness: "جاهز",
    dimensions: [
      dim("analysis", "اختيار الجمهور", 82, "وسّع الجمهور بعد ثبات النتيجة.", "اخترت جمهورًا ضيقًا ومربحًا."),
      dim("decision", "توزيع الميزانية", 81, "خصّص 20٪ للتجربة دائمًا.", "أوقفت الخاسر في اليوم الثالث."),
      dim("execution", "تشغيل الحملة", 70, "وثّق كل تعديل في سجل الحملة.", "حافظت على وتيرة الصرف."),
    ],
    xp: 208,
    badges: ["budget-sniper"],
    categoryLegacyId: 27,
    categoryName: "التسويق المتكامل",
    minutes: 16,
    highlights: [
      { at: "اليوم 3", tone: "good", text: "أوقفت الجمهور الخاسر قبل أن يستهلك ربع الميزانية." },
      { at: "اليوم 6", tone: "good", text: "حافظت على تكلفة تفاعل منخفضة حتى نهاية الحملة." },
    ],
    pre: { percent: 70, style: "analytical" },
    post: { percent: 85, style: "analytical" },
    signals: { marketingTargetMet: true },
    attemptNo: 2,
  },
  {
    id: "demo-sales-1",
    slug: "sales-discovery-call",
    at: "2026-11-06T09:00:00.000Z",
    overall: 71,
    readiness: "جاهز",
    dimensions: [
      dim("communication", "الأسئلة والاستماع", 88, "استمر في ترك المساحة للعميل.", "نسبة حديثك 42٪ فقط."),
      dim("analysis", "الاكتشاف", 70, "اسأل عن أثر المشكلة على الأرقام.", "اكتشفت ثلاث حقائق جوهرية."),
      dim("persuasion", "معالجة الاعتراض", 66, "اربط الرد بمعيار قرار العميل لا بميزات المنتج.", "تعاملت مع اعتراض المنافس بهدوء."),
      dim("empathy", "قراءة المشاعر", 52, "لاحظ انزعاج العميل وتوقف قبل العرض التالي.", "أصغيت في البداية."),
      dim("execution", "توثيق الـCRM", 74, "سجّل الخطوة التالية بتاريخ.", "حدّثت مرحلة الصفقة."),
    ],
    xp: 192,
    badges: ["deal-closer"],
    categoryLegacyId: 3,
    categoryName: "المبيعات وخدمة العملاء",
    minutes: 12,
    highlights: [
      { at: "03:10", tone: "bad", text: "قاطعت العميل أثناء شرح مشكلة التسليم، ففقدت معلومة عن الميزانية." },
      { at: "05:40", tone: "good", text: "سألت سؤالًا مفتوحًا أعاد العميل إلى الحديث عن الحجم." },
      { at: "08:20", tone: "bad", text: "عرضت السعر قبل أن تثبت وجود المشكلة." },
    ],
    pre: { percent: 62, style: "collaborative" },
    post: { percent: 76, style: "collaborative" },
    signals: { dealClosed: true },
    attemptNo: 1,
  },
  {
    id: "demo-support-1",
    slug: "support-angry-customer",
    at: "2026-11-08T09:00:00.000Z",
    overall: 76,
    readiness: "جاهز",
    dimensions: [
      dim("empathy", "تهدئة العميلة", 72, "اعترف بالمشكلة قبل شرح الإجراء.", "خفّضت التوتر بسرعة."),
      dim("communication", "وضوح الرد", 80, "اختصر الرسائل الطويلة.", "شرحت الخطوات بلا مصطلحات."),
      dim("decision", "التعويض", 74, "اختر التعويض داخل صلاحيتك دون تصعيد.", "حللت المشكلة في محادثة واحدة."),
      dim("execution", "التوثيق", 78, "أرفق رقم الشحنة في التذكرة.", "وثّقت الحل بدقة."),
    ],
    xp: 202,
    badges: ["cool-head"],
    categoryLegacyId: 3,
    categoryName: "المبيعات وخدمة العملاء",
    minutes: 10,
    highlights: [
      { at: "دقيقة 2", tone: "bad", text: "بدأت بسياسة الاستبدال قبل الاعتراف بتأخر الشحنة، فارتفع التوتر." },
      { at: "دقيقة 7", tone: "good", text: "قدّمت خيارين واضحين فاختارت العميلة الأسرع." },
    ],
    pre: { percent: 60, style: "analytical" },
    post: { percent: 78, style: "collaborative" },
    signals: { coolHead: true },
    attemptNo: 1,
  },
  {
    id: "demo-hr-1",
    slug: "hr-conflict-mediation",
    at: "2026-11-10T09:00:00.000Z",
    overall: 64,
    readiness: "جاهز",
    dimensions: [
      dim("empathy", "الاستماع للطرفين", 58, "أعد صياغة ما سمعته قبل أن تقترح حلًا.", "لم تنحز لطرف في البداية."),
      dim("communication", "الجلسة المشتركة", 74, "افتح الجلسة بقواعد واضحة.", "خفضت حدة النقاش."),
      dim("decision", "خطة الحل", 60, "اربط كل بند بمسؤول وموعد.", "وصلت إلى أرضية مشتركة."),
    ],
    xp: 178,
    badges: ["peacemaker"],
    categoryLegacyId: 5,
    categoryName: "الموارد البشرية والتدريب",
    minutes: 11,
    highlights: [
      { at: "جلسة خالد", tone: "bad", text: "سمحت للطرف الأول بقلب الجلسة الفردية إلى اتهام لفظي للطرف الثاني." },
      { at: "الجلسة المشتركة", tone: "good", text: "وضعت اتفاقًا مكتوبًا واضحًا للمراحل القادمة." },
    ],
    pre: { percent: 58, style: "avoidant" },
    post: { percent: 74, style: "collaborative" },
    signals: { peaceMade: true },
    attemptNo: 1,
  },
];

export function seedDemoProgress(): void {
  const attempts = [...demoAttempts].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  useLabsProgress.setState({
    attempts,
    xp: attempts.reduce((sum, attempt) => sum + attempt.xp, 0),
    badges: [...new Set(attempts.flatMap((attempt) => attempt.badges))],
  });
}
