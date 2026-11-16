/**
 * Seed data for the mock labs API.
 *
 * The 12 shipped labs are adapted from the static `LabDefinition` registry and marked
 * `engine: "legacy"`; their runners stay unchanged. Three schema-defined fixtures exercise the
 * admin-authored runtime: finance (published), HSE (published) and governance (draft).
 */
import type { CatalogCard } from "@/lib/api/browse";

import { labs } from "../../model/catalog";
import type { LabDefinition } from "../../model/types";
import type {
  LabDefinitionPayload,
  LabField,
  LabPathway,
  LabRecommendationCard,
  LabScoring,
} from "../contract";

const PUBLISHED_RELEASE = {
  status: "published" as const,
  locales: ["ar"],
  starts_at: null,
  ends_at: null,
  rollout_pct: 100,
};

/** The stage ids each bespoke runner emits; the mock runtime validates phase.enter against them. */
const LEGACY_STAGES: Record<string, readonly string[]> = {
  "marketing-ads": ["brief", "pre", "audience", "creative", "budget", "run", "post", "debrief"],
  "sales-discovery-call": ["brief", "pre", "prep", "call", "crm", "email", "post", "debrief"],
  "hr-conflict-mediation": ["brief", "pre", "khaled", "sara", "joint", "plan", "post", "debrief"],
  "support-angry-customer": ["brief", "pre", "console", "chat", "resolve", "post", "debrief"],
  "objections-six-types": ["brief", "pre", "dossier", "mechanic", "commit", "crm", "post", "debrief"],
  "objections-competitor-ruler": ["brief", "pre", "dossier", "mechanic", "commit", "crm", "post", "debrief"],
  "deal-recovery-real-estate": ["brief", "pre", "diagnose", "call", "redline", "crm", "post", "debrief"],
  "deal-recovery-medical": ["brief", "pre", "diagnose", "call", "redline", "crm", "post", "debrief"],
  "deal-recovery-food": ["brief", "pre", "diagnose", "call", "redline", "crm", "post", "debrief"],
  "deal-recovery-restaurants": ["brief", "pre", "diagnose", "call", "redline", "crm", "post", "debrief"],
  "ceo-competitor-response": ["brief", "pre", "diagnose", "quarters", "board", "post", "debrief"],
  "sales-failure-week": ["brief", "pre", "plan", "funnel", "questions", "call", "followup", "post", "debrief"],
  "startup-company-registration": ["brief", "pre", "form", "articles", "portal", "officer", "post", "debrief"],
  "governance-first-board": ["brief", "pre", "board", "doa", "coi", "meeting", "minutes", "post", "debrief"],
  "cfo-forecast-runway": ["brief", "pre", "diagnose", "model", "funding", "qa", "post", "debrief"],
  "finance-quarter-close": ["brief", "pre", "calendar", "rec", "entries", "vat", "variance", "review", "post", "debrief"],
  "crisis-data-leak": ["brief", "pre", "room", "statement", "post", "debrief"],
  "audit-escape-room": ["brief", "pre", "room", "memo", "post", "debrief"],
};

export function legacyDefinition(lab: LabDefinition): LabDefinitionPayload {
  return {
    schema_version: 1,
    slug: lab.slug,
    field_category_id: lab.categoryLegacyId,
    category_name: lab.categoryName,
    engine: "legacy",
    title: lab.title,
    tagline: lab.tagline,
    role: lab.role,
    scenario: lab.scenario,
    targets: [...lab.targets],
    constraints: [...lab.constraints],
    skills: [...lab.skills],
    difficulty: lab.difficulty,
    minutes: lab.minutes,
    color: lab.color,
    phases: (LEGACY_STAGES[lab.slug] ?? lab.phases.map((_, index) => `phase-${index + 1}`)).map((id) => ({
      id,
      label: id,
      type: "custom",
    })),
    personas: [],
    fields: [],
    pathway: null,
    requirements: [],
    scoring: { dimensions: [] },
    analytics: {},
    recommendations: {
      course_slugs: [...(lab.featuredCourseSlugs ?? [])],
      keywords: [...lab.courseKeywords],
      product_types: ["course", "diploma"],
    },
    legacy_slug: lab.slug,
    locale: "ar",
    release: { ...PUBLISHED_RELEASE },
  };
}

const financeFields: LabField[] = [
  {
    id: "variance_note",
    type: "textarea",
    label: { ar: "اشرح فرق التسوية الذي وجدته" },
    help: { ar: "اذكر الحساب، المبلغ، والسبب المحتمل." },
    required: true,
    validation: { max_length: 800 },
    score: { dimension: "accuracy", weight: 2 },
  },
  {
    id: "materiality",
    type: "number",
    label: { ar: "مبلغ الفرق (ر.س)" },
    required: true,
    validation: { min: 0, max: 500000, step: 500 },
    score: { dimension: "accuracy", weight: 1 },
  },
  {
    id: "adjustment",
    type: "select",
    label: { ar: "القيد المقترح" },
    required: true,
    validation: {
      options: [
        { value: "accrue", label: { ar: "استحقاق مصروف" } },
        { value: "reclass", label: { ar: "إعادة تصنيف" } },
        { value: "disclose", label: { ar: "إفصاح فقط" } },
      ],
    },
    score: { dimension: "judgment", weight: 2 },
  },
  {
    id: "sign_off",
    type: "checkbox",
    label: { ar: "أؤكد مراجعة كشف التسوية" },
    required: true,
  },
];

const financeScoring: LabScoring = {
  dimensions: [
    { key: "accuracy", label: { ar: "دقة التحليل" }, skill: "analysis", weight: 2 },
    { key: "judgment", label: { ar: "الحكم المحاسبي" }, skill: "decision", weight: 2 },
    { key: "documentation", label: { ar: "التوثيق" }, skill: "execution", weight: 1 },
  ],
  readiness: { ready: 60, excellent: 80 },
  xp: { base: 50, per_point: 2, per_badge: 50 },
};

const financePathway: LabPathway = {
  entry: "brief",
  limits: { max_steps: 20, max_minutes: 20 },
  nodes: {
    brief: { id: "brief", type: "brief", next: "review" },
    review: { id: "review", type: "form", title: { ar: "مراجعة التسوية" }, fields: ["variance_note", "materiality"], next: "decision" },
    decision: {
      id: "decision",
      type: "choice",
      title: { ar: "قرار الإقفال" },
      prompt: { ar: "الفرق 42,000 ر.س في حساب المصروفات المستحقة. ماذا تفعل قبل الإقفال؟" },
      choices: [
        { id: "accrue", label: { ar: "أُسجّل استحقاقًا وأوثّق السبب" }, next: "signoff", score: { judgment: 100 } },
        { id: "wait", label: { ar: "أنتظر تأكيد المورد" }, next: "signoff", score: { judgment: 55 } },
        { id: "ignore", label: { ar: "أُقفل وأُراجع لاحقًا" }, next: "signoff", score: { judgment: 0 } },
      ],
    },
    signoff: { id: "signoff", type: "form", title: { ar: "التوقيع" }, fields: ["adjustment", "sign_off"], next: "end" },
    end: { id: "end", type: "end", outcome: "success" },
  },
};

const hseFields: LabField[] = [
  {
    id: "hazards",
    type: "multiselect",
    label: { ar: "المخاطر التي رصدتها" },
    required: true,
    validation: {
      options: [
        { value: "fall", label: { ar: "سقوط من ارتفاع" } },
        { value: "electric", label: { ar: "تماس كهربائي" } },
        { value: "traffic", label: { ar: "حركة مركبات" } },
        { value: "noise", label: { ar: "ضوضاء" } },
      ],
    },
    score: { dimension: "identification", weight: 2 },
  },
  {
    id: "risk_rating",
    type: "range",
    label: { ar: "تقييم الخطورة (1–5)" },
    required: true,
    validation: { min: 1, max: 5, step: 1 },
    score: { dimension: "judgment", weight: 2 },
  },
  {
    id: "stop_work",
    type: "radio",
    label: { ar: "هل توقف العمل؟" },
    required: true,
    validation: {
      options: [
        { value: "yes", label: { ar: "نعم، فورًا" } },
        { value: "no", label: { ar: "لا، أكمل الجولة" } },
      ],
    },
    score: { dimension: "escalation", weight: 2 },
  },
  {
    id: "actions",
    type: "textarea",
    label: { ar: "إجراءات المعالجة" },
    required: true,
    validation: { max_length: 800 },
    score: { dimension: "documentation", weight: 1 },
  },
];

const hseScoring: LabScoring = {
  dimensions: [
    { key: "identification", label: { ar: "رصد المخاطر" }, skill: "analysis", weight: 2 },
    { key: "judgment", label: { ar: "تقدير الخطورة" }, skill: "decision", weight: 2 },
    { key: "escalation", label: { ar: "التصعيد" }, skill: "execution", weight: 2 },
    { key: "documentation", label: { ar: "التوثيق" }, skill: "communication", weight: 1 },
  ],
  readiness: { ready: 60, excellent: 80 },
};

const hsePathway: LabPathway = {
  entry: "brief",
  limits: { max_steps: 20, max_minutes: 20 },
  nodes: {
    brief: { id: "brief", type: "brief", next: "walkthrough" },
    walkthrough: {
      id: "walkthrough",
      type: "choice",
      title: { ar: "جولة التفتيش" },
      prompt: { ar: "في الطابق الثاني، العامل يقف على سقالة بلا حواجز فوق فتحة المصعد. أين تبدأ؟" },
      choices: [
        { id: "stop", label: { ar: "أوقف العمل وأُبعد العامل" }, next: "assessment", score: { escalation: 100 } },
        { id: "photo", label: { ar: "ألتقط صورة وأكمل الجولة" }, next: "assessment", score: { escalation: 40 } },
        { id: "later", label: { ar: "أسجّلها في التقرير النهائي" }, next: "assessment", score: { escalation: 0 } },
      ],
    },
    assessment: {
      id: "assessment",
      type: "form",
      title: { ar: "تقييم المخاطر" },
      fields: ["hazards", "risk_rating", "stop_work", "actions"],
      next: "end",
    },
    end: { id: "end", type: "end", outcome: "success" },
  },
};

const governanceFields: LabField[] = [
  {
    id: "conflict_type",
    type: "select",
    label: { ar: "نوع تضارب المصالح" },
    required: true,
    validation: {
      options: [
        { value: "financial", label: { ar: "مصلحة مالية" } },
        { value: "family", label: { ar: "علاقة عائلية" } },
        { value: "board_seat", label: { ar: "مقعد في مجلس آخر" } },
      ],
    },
    score: { dimension: "classification", weight: 2 },
  },
  {
    id: "disclosure",
    type: "textarea",
    label: { ar: "نص الإفصاح المقترح" },
    required: true,
    validation: { max_length: 600 },
    score: { dimension: "disclosure", weight: 2 },
  },
  {
    id: "vote",
    type: "radio",
    label: { ar: "قرارك في التصويت" },
    required: true,
    validation: {
      options: [
        { value: "recuse", label: { ar: "أمتنع وأطلب استبعادي" } },
        { value: "participate", label: { ar: "أشارك بعد الإفصاح" } },
      ],
    },
    score: { dimension: "judgment", weight: 2 },
  },
];

const governanceScoring: LabScoring = {
  dimensions: [
    { key: "classification", label: { ar: "تصنيف التضارب" }, skill: "analysis", weight: 2 },
    { key: "disclosure", label: { ar: "جودة الإفصاح" }, skill: "communication", weight: 2 },
    { key: "judgment", label: { ar: "الحكم" }, skill: "decision", weight: 2 },
  ],
  readiness: { ready: 60, excellent: 80 },
};

const governancePathway: LabPathway = {
  entry: "brief",
  limits: { max_steps: 20, max_minutes: 20 },
  nodes: {
    brief: { id: "brief", type: "brief", next: "chair" },
    chair: {
      id: "chair",
      type: "dialogue",
      title: { ar: "رئيس المجلس" },
      persona_id: "chair",
      prompt: { ar: "لدينا بند شراء من شركة تملك فيها حصة. ما موقفك؟" },
      choices: [
        { id: "declare", label: { ar: "أُفصح وأمتنع عن التصويت" }, next: "form", score: { judgment: 100 } },
        { id: "discuss", label: { ar: "أُناقش البند دون إفصاح" }, next: "form", score: { judgment: 30 } },
        { id: "silent", label: { ar: "لا أرى مشكلة" }, next: "form", score: { judgment: 0 } },
      ],
    },
    form: { id: "form", type: "form", title: { ar: "الإفصاح" }, fields: ["conflict_type", "disclosure", "vote"], next: "end" },
    end: { id: "end", type: "end", outcome: "success" },
  },
};

const financeRequirements = [
  {
    id: "entitlement",
    type: "entitlement" as const,
    label: { ar: "يتطلب دورة أو دبلومًا في المالية" },
    values: ["course", "diploma", "package"],
    on_fail: "block" as const,
  },
];

const governanceRequirements = [
  {
    id: "auth",
    type: "auth" as const,
    label: { ar: "يتطلب تسجيل الدخول" },
    on_fail: "block" as const,
  },
];

export const schemaFixtures: LabDefinitionPayload[] = [
  {
    schema_version: 1,
    slug: "finance-accrual-review",
    field_category_id: 29,
    category_name: "المالية والمحاسبة",
    engine: "schema",
    title: "مراجعة قيد مستحق",
    tagline: "فرق 42 ألفًا في التسوية وموعد الإقفال غدًا: راجع، قرّر، ووثّق.",
    role: "مدير حسابات في شركة توزيع",
    scenario:
      "قبل الإقفال بيوم، وجدت فرقًا في حساب المصروفات المستحقة. المورد لم يؤكد الفاتورة، والمدير المالي يريد الأرقام صباحًا.",
    targets: ["حدّد الفرق وسببه", "اختر القيد الصحيح", "وثّق قرارك قبل الإقفال"],
    constraints: ["موعد الإقفال غدًا", "لا تعديل دون توثيق", "الفرق يتجاوز حدّ الأهمية النسبية"],
    skills: ["analysis", "decision", "execution"],
    difficulty: "متوسط",
    minutes: 12,
    color: "teal",
    phases: [
      { id: "brief", label: "الإحاطة", type: "brief" },
      { id: "review", label: "مراجعة التسوية", type: "form" },
      { id: "decision", label: "القرار", type: "choice" },
      { id: "signoff", label: "التوقيع", type: "form" },
    ],
    personas: [],
    fields: financeFields,
    pathway: financePathway,
    requirements: financeRequirements,
    scoring: financeScoring,
    analytics: {
      metrics: [
        { key: "time_to_decision", label: { ar: "زمن القرار" } },
        { key: "documentation_quality", label: { ar: "جودة التوثيق" } },
      ],
    },
    recommendations: { keywords: ["المالية", "المحاسبة", "الإقفال", "التسوية"], product_types: ["course", "diploma"] },
    locale: "ar",
    release: { ...PUBLISHED_RELEASE },
  },
  {
    schema_version: 1,
    slug: "hse-site-inspection",
    field_category_id: 33,
    category_name: "الصحة والسلامة المهنية",
    engine: "schema",
    title: "تفتيش موقع العمل",
    tagline: "جولة تفتيش افتراضية: اكتشف المخاطر ورتّب أولويات المعالجة.",
    role: "مسؤول سلامة في موقع إنشاءات",
    scenario:
      "أنت في جولة تفتيش صباحية. في الطابق الثاني سقالة بلا حواجز فوق فتحة المصعد، وعامل يعمل دون حزام.",
    targets: ["ارصد المخاطر الحرجة", "قيّم الخطورة", "اتخذ قرار إيقاف العمل"],
    constraints: ["سلامة العامل أولًا", "التوثيق خلال الجولة", "لا تعطّل الموقع بلا سبب"],
    skills: ["analysis", "decision", "execution", "communication"],
    difficulty: "متوسط",
    minutes: 12,
    color: "yellow",
    phases: [
      { id: "brief", label: "الإحاطة", type: "brief" },
      { id: "walkthrough", label: "الجولة", type: "choice" },
      { id: "assessment", label: "التقييم", type: "form" },
    ],
    personas: [],
    fields: hseFields,
    pathway: hsePathway,
    requirements: [],
    scoring: hseScoring,
    analytics: {
      metrics: [
        { key: "hazard_detection", label: { ar: "رصد المخاطر" } },
        { key: "stop_work_decision", label: { ar: "قرار إيقاف العمل" } },
      ],
    },
    recommendations: { keywords: ["السلامة", "الصحة", "المخاطر", "التفتيش"], product_types: ["course", "diploma"] },
    locale: "ar",
    release: { ...PUBLISHED_RELEASE },
  },
  {
    schema_version: 1,
    slug: "governance-boardroom",
    field_category_id: 35,
    category_name: "الحوكمة",
    engine: "schema",
    title: "غرفة مجلس الإدارة",
    tagline: "بند شراء من شركة تملك فيها حصة: أُفصح، قرّر، ووثّق.",
    role: "عضو مجلس إدارة",
    scenario:
      "في اجتماع المجلس، طُرح بند شراء من شركة تملك فيها حصة غير مباشرة. الرئيس يطلب موقفك قبل التصويت.",
    targets: ["صنّف تضارب المصالح", "اكتب إفصاحًا واضحًا", "اتخذ قرار تصويت مبررًا"],
    constraints: ["الامتثال لسياسة الحوكمة", "الإفصاح قبل النقاش", "لا مشاركة في التصويت عند التضارب"],
    skills: ["analysis", "communication", "decision"],
    difficulty: "متقدّم",
    minutes: 14,
    color: "purple",
    phases: [
      { id: "brief", label: "الإحاطة", type: "brief" },
      { id: "chair", label: "المحادثة", type: "dialogue" },
      { id: "form", label: "الإفصاح", type: "form" },
    ],
    personas: [
      {
        id: "chair",
        name: "م. عبدالله الراشد",
        role: "رئيس مجلس الإدارة",
        tone: "purple",
        traits: ["حازم", "يهتم بالإجراءات"],
        hidden_facts: ["لديه مصلحة في الشركة الموردة"],
        triggers: [{ when: ["choice.silent"], response: "الصمت هنا ليس خيارًا." }],
      },
    ],
    fields: governanceFields,
    pathway: governancePathway,
    requirements: governanceRequirements,
    scoring: governanceScoring,
    analytics: { metrics: [{ key: "disclosure_quality", label: { ar: "جودة الإفصاح" } }] },
    recommendations: { keywords: ["الحوكمة", "المخاطر", "المجلس", "الامتثال"], product_types: ["course", "diploma"] },
    locale: "ar",
    release: { status: "draft", locales: ["ar"], starts_at: null, ends_at: null, rollout_pct: 0 },
  },
];

const card = (
  slug: string,
  productType: string,
  title: string,
  category: string,
  extra: Partial<CatalogCard> = {},
): LabRecommendationCard => ({
  product_id: `mock-${slug}`,
  slug,
  product_type: productType,
  title,
  short_description: null,
  image: null,
  price: null,
  category,
  instructor_name: null,
  instructor_avatar: null,
  instructor_key: null,
  lesson_count: 0,
  duration_seconds: null,
  updated_at: null,
  ...extra,
});

/** Recommendations that point at real storefront slugs where possible. */
export const recommendationCards: LabRecommendationCard[] = [
  card("course-129", "course", "التعامل مع اعتراضات العملاء", "المبيعات وخدمة العملاء"),
  card("course-258", "course", "فشل المبيعات", "المبيعات وخدمة العملاء"),
  card("course-10", "course", "سلوك المستهلك Consumer Behavior", "التسويق المتكامل"),
  card("course-100", "course", "أساسيات التسويق الإلكتروني", "التسويق المتكامل"),
  card("diploma-399", "diploma", "دبلوم المبيعات الاحترافية", "المبيعات وخدمة العملاء"),
  card("diploma-401", "diploma", "دبلوم التسويق الرقمي", "التسويق المتكامل"),
  card("package-5", "package", "مدير مشتريات محترف معتمد", "المالية والمحاسبة"),
  card("consultation-69", "consultation", "استشارة في أساسيات التسويق بالمحتوى", "التسويق المتكامل"),
];

export function fixturesForCategory(categoryLegacyId: number): LabRecommendationCard[] {
  if (categoryLegacyId === 3) return recommendationCards.filter((c) => ["course-129", "course-258", "diploma-399"].includes(c.slug));
  if (categoryLegacyId === 27) return recommendationCards.filter((c) => ["course-10", "course-100", "diploma-401"].includes(c.slug));
  if (categoryLegacyId === 29) return recommendationCards.filter((c) => ["package-5"].includes(c.slug));
  return recommendationCards.slice(0, 3);
}

/** All labs the mock DB starts with: the 12 shipped labs, then the schema fixtures. */
export function initialDefinitions(): LabDefinitionPayload[] {
  return [...labs.map(legacyDefinition), ...schemaFixtures];
}
