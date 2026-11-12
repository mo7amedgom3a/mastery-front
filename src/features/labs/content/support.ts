/**
 * Support lab: «أم فيصل», an angry customer (damaged fridge, double charge, threatening to post on
 * X). The ticket console, the live chat graph, the compensation form, the quizzes and the rubric.
 */
import type { DocSpec } from "../components/documents/doc-types";
import { sar } from "../components/documents/doc-types";
import { tagCount, type DialogueGraph, type DialogueState } from "../model/dialogue";
import { buildScorecard, clock } from "../model/scoring";
import type { Dimension, Highlight, QuizQuestion, Scorecard } from "../model/types";

export const ORDER_TOTAL = 4_299;
/** Goodwill an agent may grant without a supervisor. */
export const AGENT_LIMIT = 300;

export type SupportFact = "damage" | "double-charge" | "food-spoiled" | "deadline" | "prefers-replacement";

export const supportFacts: Record<SupportFact, string> = {
  damage: "الثلاجة وصلت تالفة (باب مكسور وجانب مضغوط) مع صور",
  "double-charge": "المبلغ 4,299 ر.س خُصم مرتين",
  "food-spoiled": "تلف طعام لدى العميلة أثناء الانتظار",
  deadline: "تحتاج ثلاجة تعمل قبل الخميس (عزيمة عائلية)",
  "prefers-replacement": "تفضّل الاستبدال السريع لا الفحص أو الإصلاح",
};

export const supportChat: DialogueGraph = {
  id: "support-chat",
  title: "محادثة مباشرة مع أم فيصل",
  start: "open",
  personas: {
    customer: { name: "أم فيصل", role: "عميلة منذ 2019", initials: "أف", tone: "pink" },
  },
  initial: { trust: 20, patience: 80, tension: 75 },
  visibleMeters: ["tension", "trust"],
  turnCost: { patience: -4 },
  breakpoints: [{ when: (s) => s.meters.tension >= 100, to: "public" }],
  nodes: {
    open: {
      id: "open",
      speaker: "customer",
      line: "للمرة الثالثة أكلم خدمتكم! الثلاجة وصلت مكسورة، وسحبتوا فلوسي مرتين! والحين بكتب في تويتر عن تعاملكم.",
      choices: [
        {
          id: "empathise",
          label: "أعتذر لك يا أم فيصل، ومن حقك تكونين زعلانة بعد ثلاث مكالمات. أنا معك الحين للآخر. ممكن رقم الطلب عشان أشوف كل شي بنفسي؟",
          tags: ["empathy", "ownership"],
          effects: { tension: -15, trust: 10 },
          next: "verify",
          note: { tone: "good", text: "بدأ بالاعتراف بالمشاعر وتحمّل الملكية قبل طلب البيانات." },
        },
        {
          id: "script",
          label: "أهلًا بك في خدمة عملاء بيتك. ممكن رقم الطلب لو سمحتِ؟",
          tags: ["script"],
          effects: { tension: 5 },
          next: "verify-cold",
          note: { tone: "bad", text: "رد آلي بنص جاهز على عميلة غاضبة." },
        },
        {
          id: "blame-courier",
          label: "يا ستي الكسر غالبًا من شركة الشحن، مو منا.",
          tags: ["blame"],
          effects: { tension: 25, trust: -10 },
          next: "escalate",
          note: { tone: "bad", text: "ألقى اللوم على شركة الشحن أمام العميلة." },
        },
      ],
    },
    "verify-cold": {
      id: "verify-cold",
      speaker: "customer",
      line: "رقم الطلب 48213. ولا تقول لي انتظري!",
      choices: [
        {
          id: "warm-up",
          label: "ما راح أقول لك انتظري. أعتذر عن اللي صار، خليني أفتح الطلب الحين قدامي.",
          tags: ["empathy"],
          effects: { tension: -8, trust: 5 },
          next: "verify",
          note: { tone: "good", text: "تدارك البداية الباردة باعتذار صادق." },
        },
        {
          id: "system-says",
          label: "النظام يقول إن الطلب تم تسليمه بنجاح.",
          tags: ["defensive"],
          effects: { tension: 20, trust: -10 },
          next: "escalate",
          note: { tone: "bad", text: "واجه العميلة بالنظام بدل أن يسمعها." },
        },
      ],
    },
    escalate: {
      id: "escalate",
      speaker: "customer",
      line: "يعني أنا الكذابة؟! خلاص بنشر الصور الحين، وأبي أكلم مديرك.",
      choices: [
        {
          id: "own",
          label: "لا أبدًا، وأعتذر إن كلامي فُهم كذا. المسؤولية علينا مو على الشحن، وأنا بحلها لك بنفسي الحين.",
          tags: ["empathy", "ownership"],
          effects: { tension: -20, trust: 5 },
          next: "verify",
          note: { tone: "good", text: "استعاد الموقف بتحمل المسؤولية." },
        },
        {
          id: "manager-wait",
          label: "تقدرين تطلبين المدير، بس بيكون فيه انتظار.",
          tags: ["passive"],
          effects: { tension: 20 },
          next: "manager",
          note: { tone: "bad", text: "دفع العميلة للتصعيد بدل الحل." },
        },
      ],
    },
    verify: {
      id: "verify",
      speaker: "customer",
      line: "رقم الطلب 48213. الباب مكسور والجهة اليمين مدعوسة، وأرسلت الصور مرتين. وشوف حسابي البنكي، خصمتوا 4,299 مرتين!",
      choices: [
        {
          id: "acknowledge-facts",
          label: "شفت الصور، وشفت الخصم المكرر 4,299 مرتين. هذا خطأ منا وما المفروض يصير، وما تحتاجين تثبتين شي ثاني.",
          tags: ["ownership", "verify"],
          reveals: ["damage", "double-charge"],
          effects: { tension: -10, trust: 10 },
          next: "needs",
          note: { tone: "good", text: "تحقق بنفسه من الأدلة واعترف بالخطأين بوضوح." },
        },
        {
          id: "open-report",
          label: "لازم نفتح بلاغ للمستودع، ويُرد عليك خلال 5 أيام عمل.",
          tags: ["script"],
          reveals: ["damage"],
          effects: { tension: 15 },
          next: "process",
          note: { tone: "bad", text: "أحالها لإجراء طويل مرة رابعة." },
        },
      ],
    },
    process: {
      id: "process",
      speaker: "customer",
      line: "خمس أيام؟! وفلوسي؟ والثلاجة؟ عندي أطفال، والأكل اللي كان في الثلاجة القديمة خرب وأنا أنتظركم!",
      reveals: ["food-spoiled"],
      choices: [
        {
          id: "cant-wait",
          label: "معك حق، ما ينفع ننتظر خمس أيام. خليني أسوي اللي أقدر عليه الحين، وأول شي الخصم المكرر.",
          tags: ["empathy", "ownership"],
          reveals: ["double-charge"],
          effects: { tension: -15, trust: 8 },
          next: "needs",
        },
        {
          id: "policy",
          label: "هذا الإجراء المتّبع للأسف.",
          tags: ["rigid"],
          effects: { tension: 25, trust: -10 },
          next: "manager",
          note: { tone: "bad", text: "اختبأ خلف الإجراء أمام ضرر حقيقي." },
        },
      ],
    },
    needs: {
      id: "needs",
      speaker: "customer",
      line: "طيب… وش بتسوون؟",
      choices: [
        {
          id: "ask-priority",
          label: "قبل ما أقترح: وش الأهم لك الحين، ثلاجة بديلة بسرعة، ولا استرجاع المبلغ كامل؟",
          tags: ["open-question", "listen"],
          reveals: ["prefers-replacement"],
          effects: { trust: 10 },
          next: "options",
          note: { tone: "good", text: "سأل عن أولوية العميلة قبل أن يقرر عنها." },
        },
        {
          id: "propose-tech",
          label: "أقدر أرجع المبلغ المكرر خلال 3 أيام، وأرسل فني يفحص الثلاجة.",
          tags: ["solution"],
          effects: { trust: 3 },
          next: "options-direct",
        },
      ],
    },
    options: {
      id: "options",
      speaker: "customer",
      line: "أبي ثلاجة شغالة قبل الخميس، عندنا عزيمة. وفلوسي ترجع.",
      reveals: ["deadline"],
      choices: [
        {
          id: "resolve",
          label: "تم: أرجع الخصم المكرر اليوم (يظهر خلال 3–5 أيام)، وثلاجة بديلة بتوصيل أولوية يوم الأربعاء، ونستلم المكسورة من عندك مجانًا.",
          tags: ["within-authority", "resolve"],
          effects: { tension: -20, trust: 15 },
          next: "goodwill",
          note: { tone: "good", text: "حل كامل ضمن الصلاحيات ويناسب موعد العميلة." },
        },
        {
          id: "overpromise",
          label: "أعطيك ثلاجة جديدة وتحتفظين بالقديمة، وأرجع لك المبلغ كامل كمان.",
          tags: ["over-authority", "overpromise"],
          effects: { tension: -15, trust: 5 },
          next: "over",
          note: { tone: "bad", text: "وعد يتجاوز صلاحيات الموظف (أكثر من 300 ر.س) دون موافقة مشرف." },
        },
        {
          id: "partial",
          label: "أقدر أرجع المبلغ، بس الاستبدال يحتاج موافقة القسم الفني.",
          tags: ["partial"],
          effects: { tension: 10 },
          next: "compromise",
        },
      ],
    },
    "options-direct": {
      id: "options-direct",
      speaker: "customer",
      line: "فني؟ ما أبي أحد يفحص! أبي ثلاجة تشتغل قبل الخميس، عندنا عزيمة.",
      reveals: ["deadline", "prefers-replacement"],
      effects: { tension: 5 },
      choices: [
        {
          id: "resolve-direct",
          label: "فهمتك. بدل الفني: ثلاجة بديلة بتوصيل أولوية يوم الأربعاء، ونستلم المكسورة مجانًا، والخصم المكرر يرجع اليوم.",
          tags: ["within-authority", "resolve"],
          effects: { tension: -18, trust: 12 },
          next: "goodwill",
        },
        {
          id: "overpromise-direct",
          label: "خلاص، ثلاجة جديدة وتحتفظين بالقديمة، والمبلغ كامل يرجع لك.",
          tags: ["over-authority", "overpromise"],
          effects: { tension: -12, trust: 3 },
          next: "over",
          note: { tone: "bad", text: "وعد يتجاوز صلاحيات الموظف دون موافقة مشرف." },
        },
      ],
    },
    over: {
      id: "over",
      speaker: "customer",
      line: "تمام… بس متأكد تقدر تسوي هذا كله؟",
      choices: [
        {
          id: "correct-self",
          label: "خليني أكون صريح معك: الاستبدال والاسترجاع المكرر أقدر أسويهم الحين، والباقي يحتاج موافقة المشرف وأرد عليك خلال ساعة.",
          tags: ["honesty"],
          effects: { trust: 4 },
          next: "goodwill",
          note: { tone: "good", text: "صحّح الوعد بصراحة قبل أن يصبح التزامًا." },
        },
        {
          id: "double-down",
          label: "أكيد، لا تشيلين هم.",
          tags: ["overpromise"],
          next: "goodwill",
          note: { tone: "bad", text: "ثبّت وعدًا لا يملك صلاحيته." },
        },
      ],
    },
    compromise: {
      id: "compromise",
      speaker: "customer",
      line: "يعني بعد أنتظر قسم ثاني؟ لا.",
      choices: [
        {
          id: "fix-it",
          label: "معك حق، ما يصير. رتبتها بنفسي: ثلاجة بديلة بتوصيل أولوية الأربعاء، والخصم المكرر يرجع اليوم.",
          tags: ["within-authority", "resolve", "ownership"],
          effects: { tension: -15, trust: 10 },
          next: "goodwill",
        },
        {
          id: "max",
          label: "هذا أقصى ما أقدر عليه.",
          tags: ["rigid"],
          effects: { tension: 20, trust: -5 },
          next: "manager",
          note: { tone: "bad", text: "توقف عند حد أدنى بينما الحل ضمن صلاحياته." },
        },
      ],
    },
    goodwill: {
      id: "goodwill",
      speaker: "customer",
      line: "طيب… هذا معقول.",
      choices: [
        {
          id: "credit",
          label: "وتقديرًا لتعبك وثلاث مكالمات، أضفت رصيد 150 ريال لحسابك، وهذا رقمي المباشر لو احتجتِ شي قبل الخميس.",
          tags: ["goodwill", "followup", "within-authority"],
          effects: { trust: 10, tension: -5 },
          next: "success",
          note: { tone: "good", text: "لفتة تعويض متناسبة ومتابعة شخصية." },
        },
        {
          id: "anything-else",
          label: "تمام، فيه شي ثاني أقدر أخدمك فيه؟",
          tags: ["script"],
          next: "neutral",
        },
      ],
    },
    success: {
      id: "success",
      speaker: "customer",
      line: "الحين ارتحت. شكرًا لك… وبمسح التغريدة اللي كنت كاتبتها.",
      end: "success",
    },
    neutral: { id: "neutral", speaker: "customer", line: "لا شكرًا. نشوف الأربعاء.", end: "neutral" },
    manager: { id: "manager", speaker: "customer", line: "حوّلني على المدير لو سمحت. ما عاد أبي أتكلم معك.", end: "neutral" },
    public: {
      id: "public",
      speaker: "customer",
      line: "خلاص! نشرت الصور في تويتر ومنشنت حسابكم. وأبي المدير الحين.",
      end: "fail",
    },
  },
};

// ---------- ticket console ----------

export const customerProfile = {
  name: "نورة الدوسري (أم فيصل)",
  since: "2019",
  orders: 9,
  ltv: 18_450,
  city: "الرياض · حي الياسمين",
  pastTickets: "بلاغ واحد سابق (2023) · حُل خلال يوم",
};

export const orderTimeline: readonly { at: string; text: string; flag?: boolean }[] = [
  { at: "الأحد 10:02", text: "دفع 4,299 ر.س · بطاقة مدى ****4471" },
  { at: "الأحد 10:02", text: "دفع 4,299 ر.س · بطاقة مدى ****4471 (عملية مكررة من بوابة الدفع)", flag: true },
  { at: "الإثنين 14:20", text: "شحن مع شريك التوصيل · ثلاجة دورين 24 قدم" },
  { at: "الأربعاء 17:45", text: "شريك التوصيل: «تم التسليم»" },
  { at: "الأربعاء 18:10", text: "مرفق من العميلة: 4 صور (باب مكسور، جانب مضغوط)", flag: true },
  { at: "الخميس 11:30", text: "مكالمة 1: «سيتم التواصل خلال 48 ساعة»" },
  { at: "السبت 09:15", text: "مكالمة 2: «فتح بلاغ للمستودع، 5 أيام عمل»", flag: true },
  { at: "اليوم 08:40", text: "رسالة: «للمرة الثالثة… بكتب في تويتر»", flag: true },
];

export const supportPolicy: readonly { title: string; text: string }[] = [
  { title: "تصحيح الأخطاء المالية", text: "الخصم المكرر يُرد فورًا ولا يُحتسب ضمن حد التعويض." },
  { title: "التلف أثناء التوصيل", text: "مسؤولية «بيتك» أمام العميل؛ نستبدل أو نرد المبلغ، ونسترد من شريك الشحن داخليًا." },
  { title: "صلاحية الموظف", text: `رصيد تعويضي حتى ${AGENT_LIMIT} ر.س. ما زاد عن ذلك أو أي استثناء (كالاحتفاظ بالجهاز التالف) يحتاج توقيع مشرف.` },
  { title: "التوصيل بأولوية", text: "متاح للاستبدال خلال 48 ساعة دون رسوم." },
];

export const triagePriorities = [
  { id: "low", label: "منخفضة" },
  { id: "normal", label: "عادية" },
  { id: "high", label: "عالية" },
  { id: "urgent", label: "عاجلة" },
] as const;
export type TriagePriority = (typeof triagePriorities)[number]["id"];

export const triageTags: readonly { id: string; label: string; correct: boolean }[] = [
  { id: "double-charge", label: "خصم مكرر", correct: true },
  { id: "shipping-damage", label: "تلف أثناء التوصيل", correct: true },
  { id: "public-risk", label: "خطر تصعيد علني", correct: true },
  { id: "inquiry", label: "استفسار عام", correct: false },
  { id: "cancel", label: "طلب إلغاء", correct: false },
  { id: "misuse", label: "سوء استخدام من العميل", correct: false },
];

export type Triage = { priority: TriagePriority | null; tags: string[] };

// ---------- resolution ----------

export const resolutions = [
  { id: "replace", label: "استبدال الثلاجة" },
  { id: "repair", label: "زيارة فني للإصلاح" },
  { id: "refund-return", label: "استرجاع المبلغ وإرجاع الجهاز" },
  { id: "replace-keep", label: "استبدال مع احتفاظ العميلة بالتالفة" },
] as const;
export type Resolution = (typeof resolutions)[number]["id"];

export const goodwillOptions = [0, 100, 150, 300, 500] as const;
export type Goodwill = (typeof goodwillOptions)[number];

export type CompensationForm = {
  refundDouble: boolean;
  resolution: Resolution | null;
  priority: boolean;
  pickup: boolean;
  goodwill: Goodwill;
  supervisor: boolean;
};

export const emptyForm: CompensationForm = {
  refundDouble: false,
  resolution: null,
  priority: false,
  pickup: false,
  goodwill: 0,
  supervisor: false,
};

/** Compensation that counts against the agent's authority (corrections excluded). */
export function compensationCost(form: CompensationForm): number {
  return form.goodwill + (form.resolution === "replace-keep" ? ORDER_TOTAL : 0);
}

export function needsSupervisor(form: CompensationForm): boolean {
  return compensationCost(form) > AGENT_LIMIT;
}

export const caseNotes: readonly { id: string; label: string; fact: SupportFact | "promise" | null }[] = [
  { id: "n-damage", label: "وصلت الثلاجة تالفة والعميلة أرسلت صورًا", fact: "damage" },
  { id: "n-double", label: "خُصم مبلغ الطلب 4,299 ر.س مرتين", fact: "double-charge" },
  { id: "n-deadline", label: "العميلة تحتاج ثلاجة تعمل قبل الخميس", fact: "deadline" },
  { id: "n-food", label: "تلف طعام لدى العميلة أثناء الانتظار", fact: "food-spoiled" },
  { id: "n-promise", label: "وُعدت العميلة بتعويض يتجاوز صلاحيتي ويحتاج موافقة مشرف", fact: "promise" },
  { id: "n-misuse", label: "التلف ناتج عن سوء استخدام العميلة", fact: null },
  { id: "n-courier", label: "شركة الشحن وحدها مسؤولة ولا إجراء مطلوب منا", fact: null },
];

const resolutionLabel = (id: Resolution | null) => resolutions.find((r) => r.id === id)?.label ?? "—";

/** The compensation authorisation form, filled live from the learner's input. */
export function compensationDoc(form: CompensationForm, triage: Triage, submitted: boolean): DocSpec {
  const cost = compensationCost(form);
  const over = needsSupervisor(form);
  const priority = triagePriorities.find((p) => p.id === triage.priority)?.label;
  return {
    title: "نموذج اعتماد تعويض عميل",
    subtitle: "خدمة العملاء · المستوى الثاني",
    ref: "CMP-48213-01",
    date: "12 نوفمبر 2026",
    issuer: { name: "بيتك للأجهزة المنزلية", tagline: "إدارة تجربة العملاء", color: "sky" },
    pages: [
      [
        {
          heading: "بيانات التذكرة",
          blocks: [
            {
              kind: "fields",
              fields: [
                { label: "رقم التذكرة", value: "TCK-90871" },
                { label: "رقم الطلب", value: "48213" },
                { label: "العميلة", value: customerProfile.name },
                { label: "الأولوية", value: priority ?? "لم تُحدد", empty: !priority },
                { label: "قيمة الطلب", value: sar(ORDER_TOTAL) },
                { label: "عميلة منذ", value: `${customerProfile.since} · ${customerProfile.orders} طلبات` },
              ],
            },
          ],
        },
        {
          heading: "الإجراءات المعتمدة",
          blocks: [
            {
              kind: "checks",
              items: [
                { label: "رد الخصم المكرر", checked: form.refundDouble, note: sar(ORDER_TOTAL) + " · تصحيح مالي لا يُحتسب تعويضًا" },
                { label: `الحل: ${resolutionLabel(form.resolution)}`, checked: form.resolution !== null },
                { label: "توصيل بأولوية (خلال 48 ساعة)", checked: form.priority },
                { label: "استلام الجهاز التالف مجانًا", checked: form.pickup },
              ],
            },
            {
              kind: "table",
              head: ["بند التعويض", "المبلغ"],
              rows: [
                ["رصيد تعويضي في الحساب", sar(form.goodwill)],
                ["احتفاظ بالجهاز التالف", form.resolution === "replace-keep" ? sar(ORDER_TOTAL) : sar(0)],
              ],
              foot: ["إجمالي التعويض", sar(cost)],
            },
            over
              ? {
                  kind: "callout",
                  tone: form.supervisor ? "info" : "warn",
                  text: form.supervisor
                    ? `التعويض ${sar(cost)} يتجاوز صلاحية الموظف (${sar(AGENT_LIMIT)}): أُرسل للمشرف للاعتماد.`
                    : `تنبيه: التعويض ${sar(cost)} يتجاوز صلاحية الموظف (${sar(AGENT_LIMIT)}) ولم يُطلب اعتماد المشرف.`,
                }
              : { kind: "callout", tone: "good", text: `التعويض ضمن صلاحية الموظف (${sar(AGENT_LIMIT)}).` },
          ],
        },
        {
          heading: "الاعتماد",
          blocks: [
            {
              kind: "signatures",
              parties: [
                { role: "موظف خدمة العملاء", name: "أنت", signed: submitted, date: submitted ? "12 نوفمبر 2026" : undefined },
                {
                  role: over ? "المشرف (مطلوب)" : "المشرف (غير مطلوب)",
                  name: "أ. لمى الحربي",
                  signed: submitted && form.supervisor,
                },
              ],
            },
          ],
        },
      ],
    ],
    footer: "بيتك للأجهزة المنزلية · نموذج داخلي",
  };
}

// ---------- quizzes ----------

export const supportPreQuiz: readonly QuizQuestion[] = [
  {
    prompt: "عميل يبدأ المكالمة بالصراخ: «للمرة الثالثة أتصل!». أول جملة تقولها؟",
    options: [
      { label: "رقم الطلب لو سمحت", points: 0, style: "avoidant" },
      { label: "أعتذر، من حقك تكون منزعجًا، وأنا معك حتى نحلها", points: 2, style: "collaborative" },
      { label: "أرجو أن تهدأ حتى أستطيع مساعدتك", points: 0, style: "assertive" },
    ],
    explain: "الاعتراف بالشعور أولًا يخفض التوتر، ثم تأتي البيانات.",
  },
  {
    prompt: "التلف حدث أثناء التوصيل عبر شريك شحن. أمام العميل، المسؤول هو:",
    options: [
      { label: "شركة الشحن", points: 0, style: "avoidant" },
      { label: "نحن، ونسترد داخليًا من الشريك", points: 2, style: "collaborative" },
      { label: "العميل لأنه استلم دون فحص", points: 0, style: "assertive" },
    ],
    explain: "العميل تعاقد معنا؛ تقاسم المسؤولية مع الشركاء شأن داخلي.",
  },
  {
    prompt: "العميلة تريد حلًا سريعًا. ماذا تفعل قبل أن تقترح؟",
    options: [
      { label: "أقترح أرخص حل", points: 0, style: "assertive" },
      { label: "أسأل عما يهمها أكثر: السرعة أم الاسترداد", points: 2, style: "analytical" },
      { label: "أحولها للقسم المختص", points: 0, style: "avoidant" },
    ],
    explain: "الحل الأنسب هو الذي يطابق أولوية العميل.",
  },
  {
    prompt: "عرضت تعويضًا أكبر من صلاحيتك أثناء الحماس. ماذا تفعل؟",
    options: [
      { label: "أصحح بصراحة وأطلب موافقة المشرف قبل الالتزام", points: 2, style: "analytical" },
      { label: "أنفذه وأتحمل لاحقًا", points: 0, style: "assertive" },
      { label: "أتجاهل الأمر", points: 0, style: "avoidant" },
    ],
    explain: "الصراحة مع العميل والالتزام بالصلاحيات يحميان الطرفين.",
  },
  {
    prompt: "كم تعويضًا يناسب عميلًا تضرر من خطأين واتصل ثلاث مرات؟",
    options: [
      { label: "لا شيء، الحل يكفي", points: 1, style: "avoidant" },
      { label: "لفتة متناسبة ضمن الصلاحية مع متابعة شخصية", points: 2, style: "collaborative" },
      { label: "أكبر مبلغ ممكن لإرضائه", points: 0, style: "assertive" },
    ],
    explain: "التعويض المتناسب يرمم العلاقة؛ المبالغة تكلف ولا تضيف رضا كثيرًا.",
  },
];

export const supportPostQuiz: readonly QuizQuestion[] = [
  {
    prompt: "لماذا لا يُحتسب رد الخصم المكرر ضمن حد التعويض؟",
    options: [
      { label: "لأنه تصحيح لخطأ مالي، لا تعويض", points: 2 },
      { label: "لأنه صغير", points: 0 },
      { label: "لأنه اختياري", points: 0 },
    ],
    explain: "إعادة مال العميل حقه، لا هدية.",
  },
  {
    prompt: "ما الذي يجعل «حل المشكلة من أول تواصل» ممكنًا هنا؟",
    options: [
      { label: "معرفة الصلاحيات والتصرف ضمنها دون تحويل", points: 2 },
      { label: "فتح بلاغ للمستودع", points: 0 },
      { label: "تحويلها للمدير", points: 0 },
    ],
    explain: "الموظف الذي يعرف صلاحياته يحل بدل أن يحوّل.",
  },
  {
    prompt: "أي ملاحظة لا يجب أن تُكتب في التذكرة؟",
    options: [
      { label: "التلف ناتج عن سوء استخدام العميلة", points: 2 },
      { label: "خصم مكرر", points: 0 },
      { label: "تحتاج الجهاز قبل الخميس", points: 0 },
    ],
    explain: "التوثيق يسجل الحقائق، لا الافتراضات التي تلوم العميل.",
  },
];

// ---------- observer rubric ----------

export type SupportRun = {
  triage: Triage;
  triageSeconds: number;
  chat: DialogueState;
  form: CompensationForm;
  notes: readonly string[];
};

function chatEnding(chat: DialogueState): "resolved" | "flat" | "manager" | "public" {
  if (chat.nodeId === "success") return "resolved";
  if (chat.nodeId === "neutral") return "flat";
  if (chat.nodeId === "manager") return "manager";
  return "public";
}

/** Simulated CSAT, 1–5. */
export function simulatedCsat(run: SupportRun): number {
  const { chat, form } = run;
  const ending = chatEnding(chat);
  let csat = 1 + (chat.meters.trust / 100) * 1.6;
  if (ending === "resolved") csat += 1.2;
  else if (ending === "flat") csat += 0.6;
  if (form.refundDouble) csat += 0.4;
  if (form.resolution === "replace" || form.resolution === "replace-keep") csat += form.priority ? 0.6 : 0.3;
  if (form.goodwill > 0) csat += 0.2;
  return Math.max(1, Math.min(5, Math.round(csat * 10) / 10));
}

export function scoreSupport(run: SupportRun): { scorecard: Scorecard; coolHead: boolean } {
  const { chat, form, triage, notes } = run;
  const highlights: Highlight[] = [];
  for (const entry of chat.transcript) {
    if (entry.note) highlights.push({ at: clock(entry.at), tone: entry.note.tone, text: entry.note.text });
  }
  const ending = chatEnding(chat);
  const facts = new Set(chat.facts);

  const deEscalation = (100 - chat.meters.tension) * 0.8 + (ending === "public" ? 0 : 20);
  const empathy =
    30 + tagCount(chat, "empathy", "ownership", "listen") * 14 - tagCount(chat, "blame", "script", "defensive", "rigid", "passive") * 15;

  const cost = compensationCost(form);
  const over = needsSupervisor(form);
  let policy = 100 - tagCount(chat, "over-authority") * 20 + tagCount(chat, "honesty") * 10;
  if (over && !form.supervisor) {
    policy -= 45;
    highlights.push({ at: "النموذج", tone: "bad", text: `اعتمدت تعويضًا ${cost} ر.س يتجاوز صلاحيتك دون توقيع المشرف.` });
  }
  if (!over && form.supervisor) {
    policy -= 10;
    highlights.push({ at: "النموذج", tone: "info", text: "طلبت اعتماد المشرف لتعويض ضمن صلاحيتك: تصعيد غير ضروري." });
  }

  let fcr = { resolved: 65, flat: 45, manager: 20, public: 0 }[ending];
  if (form.refundDouble) fcr += 15;
  else highlights.push({ at: "النموذج", tone: "bad", text: "لم تعتمد رد الخصم المكرر: مال العميلة ما زال محجوزًا." });
  if (form.resolution === "replace" && form.priority) fcr += 20;
  else if (form.resolution === "replace" || form.resolution === "refund-return") fcr += 10;
  else if (form.resolution === "repair") highlights.push({ at: "النموذج", tone: "bad", text: "اخترت زيارة فني بينما العميلة تريد ثلاجة تعمل قبل الخميس." });

  const costScore =
    form.resolution === "replace-keep"
      ? 5
      : form.goodwill === 100 || form.goodwill === 150
        ? 100
        : form.goodwill === 0
          ? 75
          : form.goodwill === 300
            ? 80
            : 45;
  if (form.resolution === "replace-keep")
    highlights.push({ at: "النموذج", tone: "bad", text: "احتفاظ العميلة بالجهاز التالف يضاعف التكلفة دون أثر يُذكر على رضاها." });

  let documentation = 0;
  if (triage.priority === "urgent") documentation += 20;
  else if (triage.priority === "high") documentation += 15;
  else highlights.push({ at: "الفرز", tone: "bad", text: "أولوية منخفضة لتذكرة فيها خطأ مالي وتهديد بالتصعيد العلني." });
  for (const id of triage.tags) documentation += triageTags.find((t) => t.id === id)?.correct ? 10 : -10;
  const noteScore = caseNotes.reduce((sum, note) => {
    if (!notes.includes(note.id)) return sum;
    const truth = note.fact === "promise" ? tagCount(chat, "over-authority") > 0 : note.fact !== null && facts.has(note.fact);
    return sum + (truth ? 9 : -15);
  }, 0);
  documentation += Math.max(-20, Math.min(50, noteScore));
  if (notes.some((id) => caseNotes.find((n) => n.id === id)?.fact === null))
    highlights.push({ at: "التوثيق", tone: "bad", text: "كتبت في التذكرة افتراضًا يلوم العميلة دون دليل." });

  const csat = simulatedCsat(run);
  highlights.push({ at: "الرضا", tone: csat >= 4 ? "good" : "info", text: `تقييم العميلة المتوقع ${csat.toFixed(1)} من 5.` });
  highlights.push({ at: "الفرز", tone: "info", text: `استغرقت ${clock(run.triageSeconds)} في قراءة التذكرة قبل الرد.` });

  const dimensions: Dimension[] = [
    {
      key: "deescalation",
      label: "خفض التوتر",
      score: deEscalation,
      weight: 2,
      skill: "empathy",
      praise: "حوّلت الغضب إلى هدوء خطوة بخطوة.",
      tip: "مع الغضب: اعترف بالشعور، تحمّل الملكية، ثم اطلب البيانات. لا تبدأ بالنص الجاهز.",
    },
    {
      key: "empathy",
      label: "التعاطف والملكية",
      score: empathy,
      weight: 1.5,
      skill: "communication",
      praise: "تحدثت بلغة «أنا معك» لا «النظام يقول».",
      tip: "لا تلُم الشحن ولا النظام أمام العميل؛ المسؤولية علينا ثم نسترد داخليًا.",
    },
    {
      key: "policy",
      label: "الالتزام بالصلاحيات",
      score: policy,
      weight: 2,
      skill: "decision",
      praise: "تصرفت بحزم ضمن صلاحياتك دون وعود زائدة.",
      tip: `صلاحيتك ${AGENT_LIMIT} ر.س؛ ما زاد يحتاج مشرفًا قبل الوعد، لا بعده.`,
    },
    {
      key: "fcr",
      label: "الحل من أول تواصل",
      score: fcr,
      weight: 2,
      skill: "execution",
      praise: "حللت المشكلة كاملة في محادثة واحدة.",
      tip: "اجمع الحل كله في رد واحد: رد المال، الاستبدال، التوصيل، والاستلام.",
    },
    {
      key: "cost",
      label: "تكلفة التعويض",
      score: costScore,
      weight: 1,
      skill: "analysis",
      praise: "تعويض متناسب يرمم العلاقة دون هدر.",
      tip: "التعويض المتناسب (100–150 ر.س مع متابعة) يرضي أكثر من المبالغ الكبيرة.",
    },
    {
      key: "documentation",
      label: "دقة التوثيق",
      score: documentation,
      weight: 1.5,
      skill: "execution",
      praise: "تذكرة موثقة بدقة تساعد من يأتي بعدك.",
      tip: "وثّق الحقائق التي سمعتها والتزاماتك، وصنّف التذكرة بأولويتها الحقيقية.",
    },
    {
      key: "csat",
      label: "رضا العميلة المتوقع",
      score: ((csat - 1) / 4) * 100,
      weight: 1,
      skill: "empathy",
      praise: `رضا متوقع ${csat.toFixed(1)}/5: عميلة ستعود.`,
      tip: "الرضا يأتي من سرعة الحل وملاءمته لأولوية العميل، لا من حجم التعويض.",
    },
  ];

  const verdict =
    ending === "resolved"
      ? `حوّلت عميلة غاضبة إلى راضية · رضا متوقع ${csat.toFixed(1)}/5.`
      : ending === "public"
        ? "نشرت العميلة الشكوى علنًا وطلبت المدير."
        : ending === "manager"
          ? "انتهت المحادثة بطلب التحويل للمدير."
          : "حُلت المشكلة تقنيًا لكن العلاقة لم تُرمم.";
  return {
    scorecard: buildScorecard({ dimensions, highlights, verdict }),
    coolHead: ending === "resolved" && chat.meters.tension <= 30,
  };
}
