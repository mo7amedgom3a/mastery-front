import type { BrandColor } from "@/components/ui/brand-colors";
import type { Skill } from "@/features/labs/model/types";

import { READY_BENCHMARK, type SkillStat } from "./lab-insights";

/**
 * Demo catalogue for the growth path: consultation services and expert profiles, matched to the
 * learner's weakest lab skills. Static on purpose — this prototype has no consultation inventory
 * endpoint, and the UI labels the block as demo data.
 */

export type MockConsultation = {
  id: string;
  title: string;
  expert: string;
  categoryName: string;
  skills: readonly Skill[];
  format: "1:1" | "مجموعة";
  sessions: number;
  minutes: number;
  price: number;
  rating: number;
  reviews: number;
  blurb: string;
  color: BrandColor;
};

export type MockExpert = {
  key: string;
  name: string;
  title: string;
  categoryName: string;
  skills: readonly Skill[];
  rating: number;
  sessions: number;
  bio: string;
  nextSlot: string;
  color: BrandColor;
};

/** Where a skill's courses and diplomas live in the catalog, plus the title keywords to rank them. */
export const skillCatalog: Record<Skill, { categoryLegacyId: number; categoryName: string; keywords: readonly string[] }> = {
  communication: {
    categoryLegacyId: 3,
    categoryName: "المبيعات وخدمة العملاء",
    keywords: ["التواصل", "خدمة العملاء", "الاستماع", "المكالمات", "العميل", "العلاقات"],
  },
  analysis: {
    categoryLegacyId: 27,
    categoryName: "التسويق المتكامل",
    keywords: ["التحليل", "البيانات", "القياس", "الأداء", "البحث", "الحملات"],
  },
  persuasion: {
    categoryLegacyId: 3,
    categoryName: "المبيعات وخدمة العملاء",
    keywords: ["التفاوض", "الاعتراضات", "إغلاق", "البيع الاستشاري", "الصفقات", "كبار العملاء"],
  },
  empathy: {
    categoryLegacyId: 5,
    categoryName: "الموارد البشرية والتدريب",
    keywords: ["الذكاء العاطفي", "النزاعات", "العلاقات", "خدمة العملاء", "التواصل", "القيادة"],
  },
  decision: {
    categoryLegacyId: 20,
    categoryName: "الادارة والأعمال",
    keywords: ["القرار", "القيادة", "الأزمات", "التخطيط", "الإدارة", "المنافس"],
  },
  execution: {
    categoryLegacyId: 3,
    categoryName: "المبيعات وخدمة العملاء",
    keywords: ["الجودة", "المتابعة", "العمليات", "التنفيذ", "خدمة العملاء", "الإدارة"],
  },
  strategy: {
    categoryLegacyId: 20,
    categoryName: "الادارة والأعمال",
    keywords: ["استراتيج", "التنفيذي", "القيادة", "التخطيط", "المنافس", "الأعمال"],
  },
};

export const mockConsultations: readonly MockConsultation[] = [
  {
    id: "consult-sales-discovery",
    title: "تشخيص مكالمة اكتشاف مع مشترٍ متشكك",
    expert: "نورة الحربي",
    categoryName: "المبيعات وخدمة العملاء",
    skills: ["persuasion", "communication"],
    format: "1:1",
    sessions: 1,
    minutes: 45,
    price: 450,
    rating: 4.9,
    reviews: 132,
    blurb: "اسمع مكالمتك، ونفكك الأسئلة التي لم تُطرح، ونعيد بناء سلسلة الاكتشاف على أهداف العميل.",
    color: "coral",
  },
  {
    id: "consult-objections",
    title: "ورشة إدارة الاعتراضات والرفض",
    expert: "سلطان العتيبي",
    categoryName: "المبيعات وخدمة العملاء",
    skills: ["persuasion", "empathy"],
    format: "مجموعة",
    sessions: 2,
    minutes: 90,
    price: 690,
    rating: 4.8,
    reviews: 87,
    blurb: "تمارين مباشرة على اعتراض السعر والمنافس و«أرسل لي عرضًا»، مع تغذية راجعة لكل مشارك.",
    color: "sky",
  },
  {
    id: "consult-call-review",
    title: "مراجعة أسبوعية لمكالماتك",
    expert: "ريم القحطاني",
    categoryName: "المبيعات وخدمة العملاء",
    skills: ["communication", "execution"],
    format: "1:1",
    sessions: 4,
    minutes: 30,
    price: 1200,
    rating: 4.9,
    reviews: 54,
    blurb: "أربع جلسات قصيرة على مكالماتك الحقيقية: نسبة الحديث، جودة الأسئلة، ودقة التوثيق بعدها.",
    color: "teal",
  },
  {
    id: "consult-ads-budget",
    title: "حملات بميزانية محدودة: من الخطة إلى الأرقام",
    expert: "فهد الشمري",
    categoryName: "التسويق المتكامل",
    skills: ["analysis", "decision", "execution"],
    format: "1:1",
    sessions: 1,
    minutes: 60,
    price: 520,
    rating: 4.7,
    reviews: 96,
    blurb: "نبني حملة بـ100 دولار فعليًا: تقسيم الميزانية، الجمهور، وحدود التوقف قبل حرق الميزانية.",
    color: "green",
  },
  {
    id: "consult-ads-measurement",
    title: "قراءة منصات الإعلان: أي رقم يهم؟",
    expert: "لمى الدوسري",
    categoryName: "التسويق المتكامل",
    skills: ["analysis", "execution"],
    format: "مجموعة",
    sessions: 1,
    minutes: 75,
    price: 290,
    rating: 4.6,
    reviews: 143,
    blurb: "ورشة على لوحات Meta وGoogle: الفرق بين الظهور والوصول والتفاعل، وكيف تحكم على الحملة مبكرًا.",
    color: "lilac",
  },
  {
    id: "consult-sensitive-talks",
    title: "التواصل في المواقف الحساسة",
    expert: "هند العمري",
    categoryName: "الموارد البشرية والتدريب",
    skills: ["empathy", "communication"],
    format: "1:1",
    sessions: 2,
    minutes: 45,
    price: 780,
    rating: 4.9,
    reviews: 61,
    blurb: "تدريب على المحادثات الصعبة: الأداء الضعيف، الخلاف العلني، والعميل الغاضب دون تصعيد.",
    color: "pink",
  },
  {
    id: "consult-mediation",
    title: "الوساطة: من النزاع إلى اتفاق مكتوب",
    expert: "عبدالعزيز الزهراني",
    categoryName: "الموارد البشرية والتدريب",
    skills: ["empathy", "decision"],
    format: "مجموعة",
    sessions: 2,
    minutes: 120,
    price: 850,
    rating: 4.8,
    reviews: 39,
    blurb: "نموذج وساطة من خمس خطوات، وتطبيق على نزاع فريق حقيقي مع صياغة خطة حل قابلة للقياس.",
    color: "purple",
  },
  {
    id: "consult-decisions",
    title: "القرار تحت ضغط: إطار عملي",
    expert: "ماجد البلوي",
    categoryName: "الادارة والأعمال",
    skills: ["decision", "strategy"],
    format: "1:1",
    sessions: 1,
    minutes: 50,
    price: 640,
    rating: 4.8,
    reviews: 74,
    blurb: "جلسة على قرار حقيقي معلّق عندك: البدائل، تكلفة التأخير، ومن يقرر ومتى.",
    color: "yellow",
  },
  {
    id: "consult-quarter-plan",
    title: "خطة ربعية ومراجعة مؤشرات",
    expert: "سارة المطيري",
    categoryName: "الادارة والأعمال",
    skills: ["strategy", "analysis"],
    format: "1:1",
    sessions: 2,
    minutes: 60,
    price: 980,
    rating: 4.9,
    reviews: 48,
    blurb: "نبني خطة ربع واحد بمؤشرات قليلة، ونحدد ما ستوقفه إذا لم تتحرك الأرقام.",
    color: "coral",
  },
  {
    id: "consult-ops-docs",
    title: "التنفيذ والتوثيق: CRM والملاحظات",
    expert: "ياسر الغامدي",
    categoryName: "المبيعات وخدمة العملاء",
    skills: ["execution", "decision"],
    format: "مجموعة",
    sessions: 1,
    minutes: 60,
    price: 240,
    rating: 4.5,
    reviews: 112,
    blurb: "قوالب توثيق سريعة بعد كل مكالمة، وقواعد تحديث مرحلة الصفقة بلا مبالغة في التفاؤل.",
    color: "sky",
  },
];

export const mockExperts: readonly MockExpert[] = [
  {
    key: "demo-noura-alharbi",
    name: "نورة الحربي",
    title: "مدربة مبيعات B2B ومكالمات الاكتشاف",
    categoryName: "المبيعات وخدمة العملاء",
    skills: ["persuasion", "communication"],
    rating: 4.9,
    sessions: 640,
    bio: "عملت مع فرق مبيعات تقنية في الرياض وجدة، وتتخصص في تحويل المكالمة الأولى إلى اجتماع مؤكد.",
    nextSlot: "الثلاثاء ٧:٣٠ م",
    color: "coral",
  },
  {
    key: "demo-fahad-alshamri",
    name: "فهد الشمري",
    title: "مستشار أداء تسويقي",
    categoryName: "التسويق المتكامل",
    skills: ["analysis", "execution", "decision"],
    rating: 4.7,
    sessions: 410,
    bio: "يدير ميزانيات إعلانية صغيرة ومتوسطة، ويراجع الحملات على أساس التكلفة لكل نتيجة لا عدد الظهور.",
    nextSlot: "الأربعاء ٦:٠٠ م",
    color: "green",
  },
  {
    key: "demo-hend-alomari",
    name: "هند العمري",
    title: "شريكة موارد بشرية واستشارية نزاعات",
    categoryName: "الموارد البشرية والتدريب",
    skills: ["empathy", "communication"],
    rating: 4.9,
    sessions: 295,
    bio: "تقود جلسات وساطة داخل فرق تقنية وطبية، وتدرّب المدراء على المحادثات الصعبة.",
    nextSlot: "الخميس ٥:٠٠ م",
    color: "pink",
  },
  {
    key: "demo-sara-almutairi",
    name: "سارة المطيري",
    title: "مستشارة استراتيجية وتخطيط ربعي",
    categoryName: "الادارة والأعمال",
    skills: ["strategy", "analysis", "decision"],
    rating: 4.9,
    sessions: 180,
    bio: "ساعدت شركات ناشئة على بناء لوحة مؤشرات من خمسة أرقام بدل خمسين، وعلى اتخاذ قرارات الإيقاف.",
    nextSlot: "الأحد ١٢:٠٠ م",
    color: "yellow",
  },
  {
    key: "demo-sultan-alotaibi",
    name: "سلطان العتيبي",
    title: "مدير تطوير أعمال وتفاوض",
    categoryName: "المبيعات وخدمة العملاء",
    skills: ["persuasion", "empathy", "execution"],
    rating: 4.8,
    sessions: 520,
    bio: "يتفاوض على عقود سنوية مع كبار العملاء، ويعمل على الاعتراضات التي تتكرر في السوق السعودي.",
    nextSlot: "الاثنين ٨:٠٠ م",
    color: "sky",
  },
  {
    key: "demo-lama-aldosari",
    name: "لمى الدوسري",
    title: "محللة بيانات تسويقية",
    categoryName: "التسويق المتكامل",
    skills: ["analysis", "execution"],
    rating: 4.6,
    sessions: 230,
    bio: "تبني تقارير حملات قابلة للقراءة لغير المحللين، وتعلّم الفرق كيف توقف الحملة في وقتها.",
    nextSlot: "الثلاثاء ٤:٣٠ م",
    color: "lilac",
  },
  {
    key: "demo-majed-albalawi",
    name: "ماجد البلوي",
    title: "مدير عام سابق ومستشار قرارات",
    categoryName: "الادارة والأعمال",
    skills: ["decision", "strategy", "execution"],
    rating: 4.8,
    sessions: 310,
    bio: "أدار شركة خدمات في مرحلة توسع صعبة، ويتخصص في القرارات تحت ضغط الوقت ونقص المعلومات.",
    nextSlot: "الجمعة ١١:٠٠ ص",
    color: "purple",
  },
];

/** How strongly an item fits the learner's gaps; the widest gap weighs most. */
function fit(item: { skills: readonly Skill[] }, gaps: readonly SkillStat[]): number {
  return item.skills.reduce((sum, skill) => {
    const gap = gaps.find((entry) => entry.skill === skill);
    return sum + (gap ? READY_BENCHMARK - (gap.level ?? 0) : 4);
  }, 0);
}

export function pickConsultations(gaps: readonly SkillStat[], count = 2): MockConsultation[] {
  return [...mockConsultations]
    .map((item, index) => ({ item, index, score: fit(item, gaps) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, count)
    .map((entry) => entry.item);
}

export function pickExperts(gaps: readonly SkillStat[], count = 2): MockExpert[] {
  return [...mockExperts]
    .map((item, index) => ({ item, index, score: fit(item, gaps) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, count)
    .map((entry) => entry.item);
}
