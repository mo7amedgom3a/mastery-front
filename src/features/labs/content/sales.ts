/**
 * Sales Call Sim: Tarek Al-Mansoor (VP Supply Chain, Apex Logistics), the mock CRM, the
 * follow-up email blocks, the quizzes and the observer rubric.
 */
import { learnerTalkShare, tagCount, type DialogueGraph, type DialogueState } from "../model/dialogue";
import { buildScorecard, clock } from "../model/scoring";
import type { Dimension, Highlight, QuizQuestion, Scorecard } from "../model/types";

export type SalesFact = "fuel" | "cfo" | "timeline" | "budget" | "vendor";

export const salesFacts: Record<SalesFact, string> = {
  fuel: "هدر وقود يقارب 15٪ بسبب مسارات غير مثالية",
  cfo: "المدير المالي يعتمد القرار النهائي",
  timeline: "الحل يجب أن يعمل قبل الربع الثالث (موسم العقود)",
  budget: "سقف الميزانية 40 ألف دولار سنويًا",
  vendor: "تجربة سيئة مع مزود سابق (لا تكامل، ودعم اختفى)",
};

const tarekGuards = {
  /** Pitching before three open discovery questions sounds generic. */
  tooEarly: (s: DialogueState) => tagCount(s, "open-question") < 3,
  trusted: (s: DialogueState) => s.meters.trust >= 60,
};

export const salesCall: DialogueGraph = {
  id: "sales-call",
  title: "مكالمة مع طارق المنصور",
  start: "opening",
  personas: {
    tarek: { name: "طارق المنصور", role: "نائب الرئيس لسلاسل الإمداد، أبكس", initials: "طم", tone: "sky" },
  },
  initial: { trust: 35, patience: 70, tension: 30 },
  visibleMeters: ["trust", "patience"],
  turnCost: { patience: -3 },
  breakpoints: [{ when: (s) => s.meters.patience <= 0, to: "hangup" }],
  nodes: {
    opening: {
      id: "opening",
      speaker: "tarek",
      line: "ألو، طارق معك. عندي عشر دقايق بس… وش عندك؟",
      choices: [
        {
          id: "open-situation",
          label: "شكرًا على وقتك يا أستاذ طارق. قبل ما أعرض أي شي، ودّي أفهم وضعكم: كيف تخططون مسارات الأسطول اليوم؟",
          tags: ["open-question", "rapport"],
          effects: { trust: 10 },
          next: "situation",
          note: { tone: "good", text: "افتتاح ممتاز: طلب الإذن وبدأ بسؤال مفتوح بدل العرض." },
        },
        {
          id: "pitch-first",
          label: "عندنا منصة ذكية لتحسين المسارات توفّر حتى 20٪ من الوقود، وفيها لوحة تحكم وتقارير وتطبيق للسائقين، خلّني أشرح لك المزايا…",
          tags: ["pitch"],
          effects: { patience: -15, trust: -5 },
          seconds: 40,
          next: "pitch-gate",
          note: { tone: "bad", text: "بدأ بعرض المنتج قبل أي سؤال اكتشاف." },
        },
        {
          id: "rush-close",
          label: "أكيد مشغول، بختصر عليك: نحجز معك عرض توضيحي الأسبوع الجاي؟",
          tags: ["close", "pushy"],
          effects: { patience: -15, trust: -10 },
          next: "rushed",
          note: { tone: "bad", text: "طلب الالتزام قبل بناء أي قيمة." },
        },
      ],
    },
    "pitch-gate": {
      id: "pitch-gate",
      speaker: "tarek",
      line: "طيب…",
      redirect: [{ when: tarekGuards.tooEarly, to: "generic" }],
      next: "competitor-objection",
    },
    generic: {
      id: "generic",
      speaker: "tarek",
      line: "كلام عام… كيف يفيد هذا أسطولي من 120 شاحنة بالضبط؟",
      choices: [
        {
          id: "recover-problem",
          label: "معك حق، خلني أسألك أول: وش أكبر تحدي تشغيلي تواجهونه مع الأسطول هالفترة؟",
          tags: ["open-question", "recovery"],
          effects: { trust: 5 },
          next: "problem",
          note: { tone: "good", text: "تدارك الموقف وعاد إلى الاكتشاف." },
        },
        {
          id: "double-down",
          label: "عملاؤنا في القطاع وفّروا ملايين، صدقني بيعجبك النظام.",
          tags: ["pitch"],
          effects: { patience: -20, trust: -10 },
          next: "last-chance",
          note: { tone: "bad", text: "كرر الادعاءات العامة بدل فهم وضع العميل." },
        },
      ],
    },
    rushed: {
      id: "rushed",
      speaker: "tarek",
      line: "عرض؟ ما أدري وش تبيعون أصلًا. اختصر لو سمحت.",
      choices: [
        {
          id: "apologise-ask",
          label: "عذرًا، استعجلت. سؤال واحد بس: كيف تخططون مسارات الشاحنات اليوم؟",
          tags: ["open-question", "empathy"],
          effects: { trust: 5 },
          next: "situation",
        },
        {
          id: "pitch-after-rush",
          label: "نحن منصة لتحسين المسارات بالذكاء الاصطناعي، نخدم أكبر الشركات في المنطقة ونوفر الوقت والوقود والصيانة…",
          tags: ["pitch"],
          effects: { patience: -10 },
          seconds: 35,
          next: "generic",
        },
      ],
    },
    "last-chance": {
      id: "last-chance",
      speaker: "tarek",
      line: "ما عندي وقت لكلام تسويقي. عندك سؤال محدد ولا نقفل؟",
      choices: [
        {
          id: "specific-q",
          label: "سؤال محدد: وش اللي يكلفكم أكثر في تشغيل الأسطول اليوم؟",
          tags: ["open-question", "recovery"],
          next: "problem",
        },
        {
          id: "one-minute",
          label: "بس دقيقة وحدة أشرح لك كيف نشتغل…",
          tags: ["pitch"],
          effects: { patience: -40 },
          next: "hangup",
          note: { tone: "bad", text: "تجاهل إشارة نفاد الصبر الواضحة." },
        },
      ],
    },
    situation: {
      id: "situation",
      speaker: "tarek",
      line: "نستخدم FleetTrack من ثلاث سنين والفريق متعوّد عليه. المسارات يحطها المشرفين كل صباح على حسب الطلبات.",
      choices: [
        {
          id: "wish",
          label: "وش الأشياء اللي تتمنى لو أن طريقة التخطيط الحالية تسويها أفضل؟",
          tags: ["open-question"],
          effects: { trust: 5 },
          next: "problem",
          note: { tone: "good", text: "سؤال يفتح باب الألم دون مهاجمة المنافس." },
        },
        {
          id: "fleet-size",
          label: "كم شاحنة عندكم بالضبط؟",
          tags: ["closed-question"],
          next: "situation-2",
        },
        {
          id: "bash-competitor",
          label: "FleetTrack نظام قديم صراحة، نظامنا أفضل منه بمراحل.",
          tags: ["competitor-bash", "pitch"],
          effects: { trust: -15, patience: -10 },
          next: "competitor-defensive",
          note: { tone: "bad", text: "انتقد أداة يختارها العميل نفسه، فاستفز دفاعيته." },
        },
      ],
    },
    "situation-2": {
      id: "situation-2",
      speaker: "tarek",
      line: "120 شاحنة، تغطي الرياض والشرقية.",
      choices: [
        {
          id: "cost-driver",
          label: "على هالحجم، وش أكثر بند تشغيلي يقلقك اليوم؟",
          tags: ["open-question"],
          next: "problem",
        },
        {
          id: "pitch-size",
          label: "ممتاز، نظامنا مصمم بالضبط لأساطيل بهذا الحجم، وعندنا ميزات كثيرة لكم.",
          tags: ["pitch"],
          effects: { patience: -10 },
          next: "pitch-gate",
        },
      ],
    },
    "competitor-defensive": {
      id: "competitor-defensive",
      speaker: "tarek",
      line: "FleetTrack شغّال معنا، لا تقلل منه. أنا اللي اخترته.",
      choices: [
        {
          id: "apologise-competitor",
          label: "حقك، ما قصدت أقلل من اختيارك. ودّي أفهم: وين تشوف الفجوة الأكبر في التشغيل اليوم؟",
          tags: ["open-question", "empathy", "recovery"],
          effects: { trust: 5 },
          next: "problem",
        },
        {
          id: "insist-competitor",
          label: "بس الأرقام ما تكذب، أغلب عملائهم انتقلوا لنا.",
          tags: ["competitor-bash"],
          effects: { patience: -40, trust: -10 },
          next: "hangup",
        },
      ],
    },
    problem: {
      id: "problem",
      speaker: "tarek",
      line: "صراحة… الوقود. أرقام الربع الماضي تقول عندنا هدر تقريبًا 15٪، مسارات مو مثالية ورجوع فاضي.",
      reveals: ["fuel"],
      choices: [
        {
          id: "implication",
          label: "15٪ على أسطول 120 شاحنة رقم كبير. كيف ينعكس هذا على الميزانية وعقودكم مع العملاء؟",
          tags: ["open-question", "implication"],
          effects: { trust: 10 },
          next: "implication",
          note: { tone: "good", text: "سؤال أثر (SPIN) جعل العميل يشعر بحجم المشكلة." },
        },
        {
          id: "price-now",
          label: "ممتاز، هذا بالضبط اللي نحله! خلني أعطيك فكرة عن الأسعار.",
          tags: ["pitch"],
          effects: { patience: -5 },
          next: "price-early",
          note: { tone: "bad", text: "قفز إلى السعر قبل فهم أثر المشكلة وصاحب القرار." },
        },
      ],
    },
    "price-early": {
      id: "price-early",
      speaker: "tarek",
      line: "طيب، كم؟",
      choices: [
        {
          id: "anchor-high",
          label: "الباقة المناسبة لكم تبدأ من 60 ألف دولار سنويًا.",
          tags: ["price-dump"],
          effects: { trust: -10, patience: -10 },
          next: "price-shock",
        },
        {
          id: "value-first",
          label: "السعر يعتمد على حجم الوفر، وما أبي أعطيك رقم عشوائي. كيف يأثر هدر الوقود على ميزانيتكم اليوم؟",
          tags: ["open-question", "implication", "objection-handle"],
          effects: { trust: 5 },
          next: "implication",
        },
      ],
    },
    "price-shock": {
      id: "price-shock",
      speaker: "tarek",
      line: "60 ألف؟! هذا فوق اللي نقدر عليه بكثير.",
      choices: [
        {
          id: "discount",
          label: "ولا يهمك، نقدر ننزّل لك لـ35 ألف.",
          tags: ["discount"],
          effects: { trust: -10 },
          next: "implication",
          note: { tone: "bad", text: "خصم فوري دون مقابل: أضعف قيمة العرض ومصداقية السعر." },
        },
        {
          id: "ask-budget",
          label: "مفهوم. وش الإطار المالي اللي يكون منطقي لكم لحل يعالج هدر الوقود؟",
          tags: ["open-question", "objection-handle"],
          effects: { trust: 5 },
          next: "budget",
        },
      ],
    },
    implication: {
      id: "implication",
      speaker: "tarek",
      line: "يأثر كثير. الإدارة المالية تضغط علينا، والمدير المالي صار يراجع كل مصروف تشغيلي بنفسه.",
      reveals: ["cfo"],
      choices: [
        {
          id: "need-payoff",
          label: "لو قدرنا ننزّل الهدر للنص، وش يعني هذا لك ولفريقك؟",
          tags: ["open-question", "need-payoff"],
          effects: { trust: 10 },
          next: "need-payoff",
          note: { tone: "good", text: "سؤال عائد الحاجة: جعل العميل يصيغ القيمة بنفسه." },
        },
        {
          id: "decision-process",
          label: "يعني القرار عند المدير المالي؟ ودّي أفهم كيف تمشي الموافقة على حل مثل هذا، ومتى تحتاجونه يشتغل؟",
          tags: ["open-question", "qualification"],
          effects: { trust: 5 },
          next: "timeline",
        },
      ],
    },
    "need-payoff": {
      id: "need-payoff",
      speaker: "tarek",
      line: "يعني أرتاح من اجتماعات الميزانية كل شهر، والسائقين يخلصون بدري. بس لازم يكون شغّال قبل الربع الثالث، هذا موسم العقود الكبيرة.",
      reveals: ["timeline"],
      choices: [
        {
          id: "ask-budget-np",
          label: "واضح. وعشان أقترح شي واقعي: وش الميزانية المعتمدة لبند مثل هذا؟",
          tags: ["open-question", "qualification"],
          next: "budget",
        },
        {
          id: "skip-budget",
          label: "الربع الثالث وقت ممتاز، نقدر نبدأ التركيب الشهر الجاي.",
          tags: ["assume"],
          effects: { patience: -5 },
          next: "competitor-objection",
          note: { tone: "info", text: "فاتته فرصة سؤال الميزانية." },
        },
      ],
    },
    timeline: {
      id: "timeline",
      speaker: "tarek",
      line: "أنا أرفع التوصية والمدير المالي يعتمد. ولازم أي حل يكون شغّال قبل الربع الثالث، هذا موسم العقود.",
      reveals: ["cfo", "timeline"],
      choices: [
        {
          id: "ask-budget-tl",
          label: "مفهوم. وعشان تكون التوصية سهلة الاعتماد: وش سقف الميزانية اللي يرتاح له المدير المالي؟",
          tags: ["open-question", "qualification"],
          next: "budget",
        },
        {
          id: "skip-budget-tl",
          label: "تمام، نقدر نلحق الربع الثالث بسهولة.",
          tags: ["assume"],
          next: "competitor-objection",
        },
      ],
    },
    budget: {
      id: "budget",
      speaker: "tarek",
      line: "الميزانية المعتمدة لهالبند حدها 40 ألف دولار سنويًا، وما أقدر أتعداها بدون مبرر قوي.",
      reveals: ["budget"],
      choices: [
        {
          id: "ack-budget",
          label: "شكرًا على الوضوح. هذا يساعدني أقترح شي يناسب الإطار هذا.",
          tags: ["listen"],
          effects: { trust: 5 },
          next: "competitor-objection",
        },
        {
          id: "push-budget",
          label: "40 ألف قليلة شوي على اللي نقدمه، بس نشوف.",
          tags: ["pushy"],
          effects: { trust: -10 },
          next: "competitor-objection",
        },
      ],
    },
    "competitor-objection": {
      id: "competitor-objection",
      speaker: "tarek",
      line: "بس خلني أكون صريح: ليش أغيّر من FleetTrack وأتعب الفريق في نظام جديد؟",
      choices: [
        {
          id: "reframe-fuel",
          label: "سؤال منطقي. FleetTrack ممتاز في التتبع، لكن الهدر 15٪ اللي ذكرته يجي من التخطيط المسبق للمسارات. نقدر نشتغل جنبه بدون ما نلغيه.",
          tags: ["objection-handle"],
          requires: ["fuel"],
          effects: { trust: 15 },
          next: "vendor-conflict",
          note: { tone: "good", text: "استخدم بيانات العميل نفسه (15٪) للرد على اعتراض المنافس." },
        },
        {
          id: "generic-better",
          label: "نظامنا أحدث وأسرع وفيه ذكاء اصطناعي.",
          tags: ["pitch"],
          effects: { trust: -5, patience: -10 },
          next: "vendor-conflict",
          note: { tone: "bad", text: "رد عام على اعتراض محدد." },
        },
        {
          id: "free-month",
          label: "تقدر تجربه مجانًا شهر كامل بدون أي التزام.",
          tags: ["discount"],
          effects: { trust: -5 },
          next: "vendor-conflict",
        },
      ],
    },
    "vendor-conflict": {
      id: "vendor-conflict",
      speaker: "tarek",
      line: "وبصراحة، آخر مزوّد وعدنا بالسما، وبعد ستة شهور تركنا مع نظام نص شغّال. ليش أصدقك أنت؟",
      reveals: ["vendor"],
      effects: { tension: 25 },
      choices: [
        {
          id: "empathy-vendor",
          label: "أفهم إحباطك، وهذا شي مكلف فعلًا. وش اللي صار بالضبط؟ ودّي أعرف عشان ما يتكرر.",
          tags: ["empathy", "listen", "objection-handle"],
          effects: { trust: 15, tension: -20 },
          next: "vendor-detail",
          note: { tone: "good", text: "تعامل مع الغضب بالتعاطف والاستماع بدل الدفاع." },
        },
        {
          id: "proof",
          label: "عندي عميل في الدمام بنفس حجمكم، تقدر تكلّم مديره مباشرة وتسمع منه.",
          tags: ["objection-handle", "proof"],
          effects: { trust: 8, tension: -10 },
          next: "refusal",
        },
        {
          id: "defensive",
          label: "إحنا مو مثلهم أبد، عندنا أفضل فريق في السوق.",
          tags: ["defensive"],
          effects: { trust: -15, tension: 10, patience: -10 },
          next: "refusal",
          note: { tone: "bad", text: "دفاع عن الشركة بدل الاعتراف بتجربة العميل." },
        },
      ],
    },
    "vendor-detail": {
      id: "vendor-detail",
      speaker: "tarek",
      line: "التطبيق ما كان مربوط مع نظامنا المحاسبي، وفريق الدعم اختفى بعد التوقيع.",
      choices: [
        {
          id: "pilot",
          label: "عشان كذا أقترح تجربة محدودة على 20 شاحنة، بمؤشرات نجاح نتفق عليها مسبقًا، ومدير حساب مخصص يتابع معك أسبوعيًا.",
          tags: ["solution", "risk-reversal"],
          effects: { trust: 15 },
          next: "refusal",
          note: { tone: "good", text: "حوّل مخاوف العميل إلى تصميم الحل (تجربة محدودة ومؤشرات نجاح)." },
        },
        {
          id: "promise-all",
          label: "نضمن لك تكامل كامل مع كل أنظمتكم من أول يوم.",
          tags: ["overpromise"],
          effects: { trust: -5 },
          next: "refusal",
          note: { tone: "bad", text: "وعد مطلق دون معرفة أنظمة العميل: نفس خطأ المزود السابق." },
        },
      ],
    },
    refusal: {
      id: "refusal",
      speaker: "tarek",
      line: "طيب… أرسل لي إيميل فيه التفاصيل وأشوف.",
      choices: [
        {
          id: "earn-meeting",
          label: "أكيد بأرسل. بس عشان يكون الإيميل مفيد لك وللمدير المالي: وش لازم يشوف عشان يوافق على تجربة؟",
          tags: ["open-question", "close"],
          effects: { trust: 5 },
          next: "close",
          note: { tone: "good", text: "حوّل الرفض المهذب إلى سؤال يفتح الخطوة التالية." },
        },
        {
          id: "push-meeting",
          label: "خلنا نحجز الحين أحسن، متى يناسبك بكرة؟",
          tags: ["pushy", "close"],
          effects: { patience: -10 },
          next: "push-gate",
        },
        {
          id: "accept-email",
          label: "تمام، أرسله اليوم. شكرًا على وقتك!",
          tags: ["passive"],
          next: "end-weak",
          note: { tone: "info", text: "قبل الرفض المهذب دون خطوة تالية محددة." },
        },
      ],
    },
    "push-gate": {
      id: "push-gate",
      speaker: "tarek",
      line: "همم…",
      redirect: [{ when: tarekGuards.trusted, to: "close" }],
      next: "end-weak",
    },
    close: {
      id: "close",
      speaker: "tarek",
      line: "يبي يشوف رقم الوفر المتوقع والتكلفة الإجمالية. لو جبت هذا… نقدر نجلس الأسبوع الجاي معي ومع المدير المالي.",
      choices: [
        {
          id: "concrete-close",
          label: "ممتاز. أقترح الثلاثاء الساعة 10 الصباح، معك ومع المدير المالي، وبجهّز تحليل وفر على بياناتكم. يناسبك؟",
          tags: ["close"],
          effects: { trust: 5 },
          next: "end-success",
          note: { tone: "good", text: "إغلاق محدد: موعد، حضور صاحب القرار، ومخرج واضح." },
        },
        {
          id: "vague-close",
          label: "تمام، أتواصل معك لاحقًا ونحدد.",
          tags: ["passive"],
          next: "end-weak",
          note: { tone: "info", text: "إغلاق مبهم بدون موعد." },
        },
      ],
    },
    "end-success": {
      id: "end-success",
      speaker: "tarek",
      line: "الثلاثاء 10 مناسب. أرسل لي الدعوة والتحليل قبلها بيوم. مع السلامة.",
      end: "success",
    },
    "end-weak": {
      id: "end-weak",
      speaker: "tarek",
      line: "تمام، يوصلني الإيميل. مع السلامة.",
      end: "neutral",
    },
    hangup: {
      id: "hangup",
      speaker: "tarek",
      line: "اسمح لي، عندي اجتماع ثاني. مع السلامة. (أنهى المكالمة)",
      end: "fail",
    },
  },
};

// ---------- pre-call CRM ----------

export const accountRecord = {
  company: "أبكس للخدمات اللوجستية",
  industry: "نقل بري وتوزيع",
  size: "500 موظف · 120 شاحنة",
  region: "الرياض والمنطقة الشرقية",
  contact: "طارق المنصور · نائب الرئيس لسلاسل الإمداد",
  current: "FleetTrack (منذ 2023)",
  notes: [
    "مارس: تقرير قطاعي يذكر ارتفاع أسعار الديزل 12٪ هذا العام.",
    "أبريل: طارق نشر على لينكدإن عن «ضغط موسم العقود في الصيف».",
    "مايو: أبكس فازت بعقد توزيع جديد في الدمام.",
  ],
};

export type Hypothesis = { id: string; label: string; correct: boolean };

export const hypotheses: readonly Hypothesis[] = [
  { id: "fuel", label: "تكاليف الوقود ترتفع مع ارتفاع الديزل", correct: true },
  { id: "routes", label: "تخطيط المسارات يدوي أو غير مثالي", correct: true },
  { id: "season", label: "ضغط زمني قبل موسم العقود في الصيف", correct: true },
  { id: "drivers", label: "صعوبة في توظيف السائقين", correct: false },
  { id: "warehouse", label: "الحاجة لأتمتة المستودعات", correct: false },
  { id: "invoices", label: "أخطاء في فوترة العملاء", correct: false },
];

// ---------- post-call CRM logging ----------

export const crmStages = [
  { id: "qualification", label: "تأهيل أولي" },
  { id: "discovery", label: "اكتشاف مكتمل · اجتماع مع صاحب القرار" },
  { id: "proposal", label: "عرض سعر مُرسل" },
  { id: "negotiation", label: "تفاوض" },
  { id: "lost", label: "مغلقة · خسارة" },
] as const;

export type CrmStage = (typeof crmStages)[number]["id"];

export const crmNextSteps = [
  { id: "meeting", label: "اجتماع الثلاثاء 10 ص مع طارق والمدير المالي + تحليل الوفر" },
  { id: "email-followup", label: "إرسال إيميل ومتابعة بعد أسبوعين" },
  { id: "nurture", label: "إضافة لقائمة المتابعة الربعية" },
  { id: "none", label: "لا توجد خطوة تالية" },
] as const;

export type CrmNextStep = (typeof crmNextSteps)[number]["id"];

export const crmNoteOptions: readonly { id: string; label: string; fact: SalesFact | null }[] = [
  { id: "n-fuel", label: "هدر وقود ~15٪", fact: "fuel" },
  { id: "n-budget", label: "سقف الميزانية 40 ألف$/سنة", fact: "budget" },
  { id: "n-cfo", label: "المدير المالي يعتمد القرار", fact: "cfo" },
  { id: "n-timeline", label: "يجب التشغيل قبل الربع الثالث", fact: "timeline" },
  { id: "n-vendor", label: "تجربة سيئة مع مزود سابق", fact: "vendor" },
  { id: "n-replace", label: "يريد استبدال FleetTrack فورًا", fact: null },
  { id: "n-budget100", label: "الميزانية مفتوحة حتى 100 ألف$", fact: null },
];

export type CrmEntry = { stage: CrmStage | null; dealValue: number | null; notes: string[]; nextStep: CrmNextStep | null };

// ---------- follow-up email ----------

export type EmailBlock = {
  id: string;
  text: string;
  /** Good only once these facts were discovered on the call. */
  needs?: readonly SalesFact[];
  needsSuccess?: boolean;
  /** A promise the rep cannot keep, or a tone mistake. */
  wrong?: string;
};

export const emailBlocks: readonly EmailBlock[] = [
  { id: "e-thanks", text: "أستاذ طارق، شكرًا على وقتك اليوم وعلى صراحتك." },
  { id: "e-fuel", text: "فهمت أن هدر الوقود يقارب 15٪ بسبب المسارات، وأن الحل يجب أن يعمل قبل الربع الثالث.", needs: ["fuel", "timeline"] },
  { id: "e-pilot", text: "نقترح تجربة محدودة على 20 شاحنة بمؤشرات نجاح متفق عليها ومدير حساب مخصص." },
  { id: "e-budget", text: "سنقدّم تحليل وفر وتكلفة إجمالية ضمن إطار 40 ألف دولار سنويًا.", needs: ["budget"] },
  { id: "e-meeting", text: "أرفقت دعوة اجتماع الثلاثاء 10 صباحًا معك ومع المدير المالي.", needsSuccess: true },
  { id: "e-discount", text: "وإذا وقّعت هذا الأسبوع نعطيك سعرًا خاصًا 25 ألف دولار.", wrong: "خصم غير معتمد وضغط بموعد مصطنع." },
  { id: "e-guarantee", text: "ونضمن لك توفير 30٪ من الوقود من الشهر الأول.", wrong: "وعد بنتيجة لا يمكن ضمانها (ضعف ما ذكره العميل)." },
  { id: "e-bash", text: "وبصراحة FleetTrack لم يعد مناسبًا لشركة بحجمكم.", wrong: "انتقاد أداة يختارها العميل." },
];

// ---------- quizzes ----------

export const salesPreQuiz: readonly QuizQuestion[] = [
  {
    prompt: "عميل يقول في أول دقيقة: «عندي خمس دقائق فقط». ماذا تفعل؟",
    options: [
      { label: "أعرض أهم ثلاث مزايا بسرعة قبل أن ينتهي الوقت", points: 0, style: "assertive" },
      { label: "أحترم الوقت وأسأل سؤالًا واحدًا عن أكبر تحدٍّ لديه الآن", points: 2, style: "collaborative" },
      { label: "أقترح تأجيل المكالمة لوقت أنسب له", points: 1, style: "avoidant" },
    ],
    explain: "احترام الوقت مع سؤال اكتشاف مركّز يبني الثقة ويكسبك دقائق إضافية.",
  },
  {
    prompt: "العميل يذكر أنه يستخدم منتج منافس ومرتاح له. أفضل رد؟",
    options: [
      { label: "أوضح لماذا منتجنا أفضل من المنافس", points: 0, style: "assertive" },
      { label: "أسأل ما الذي يعجبه فيه وما الذي يتمنى أن يكون أفضل", points: 2, style: "analytical" },
      { label: "أنهي المكالمة بلطف لأنه غير مهتم", points: 0, style: "avoidant" },
    ],
    explain: "الفضول تجاه تجربة العميل يكشف الفجوات دون استفزاز دفاعيته.",
  },
  {
    prompt: "سأل العميل عن السعر قبل أن تفهم احتياجه. ماذا تفعل؟",
    options: [
      { label: "أعطيه أعلى سعر لأترك مجالًا للتفاوض", points: 0, style: "assertive" },
      { label: "أعطيه نطاقًا تقريبيًا ثم أربط السعر بحجم الوفر وأعود للأسئلة", points: 2, style: "analytical" },
      { label: "أقدم خصمًا مباشرة لأكسب اهتمامه", points: 0, style: "collaborative" },
    ],
    explain: "السعر بلا سياق قيمة يتحول إلى رقم مجرد؛ اربطه بالعائد.",
  },
  {
    prompt: "العميل غاضب من تجربة سابقة مع مزود آخر. ما أول خطوة؟",
    options: [
      { label: "أؤكد أننا مختلفون تمامًا عنهم", points: 0, style: "assertive" },
      { label: "أعترف بإحباطه وأسأل ماذا حدث بالضبط", points: 2, style: "collaborative" },
      { label: "أنتقل لموضوع آخر لتجنب التوتر", points: 0, style: "avoidant" },
    ],
    explain: "الاعتراف بالمشاعر ثم الاستماع يحوّل الغضب إلى متطلبات واضحة للحل.",
  },
  {
    prompt: "قال العميل: «أرسل لي إيميل وأشوف». ماذا تفعل؟",
    options: [
      { label: "أشكره وأرسل الإيميل", points: 1, style: "avoidant" },
      { label: "أوافق وأسأل ما الذي يجب أن يتضمنه ليكون مفيدًا لصاحب القرار", points: 2, style: "collaborative" },
      { label: "أصر على حجز موعد الآن", points: 0, style: "assertive" },
    ],
    explain: "«أرسل إيميل» غالبًا رفض مهذب؛ حوّله إلى خطوة تالية مفيدة للطرفين.",
  },
];

export const salesPostQuiz: readonly QuizQuestion[] = [
  {
    prompt: "في منهجية SPIN، ما الهدف من أسئلة «الأثر» (Implication)؟",
    options: [
      { label: "معرفة حجم الشركة وعدد موظفيها", points: 0 },
      { label: "جعل العميل يدرك كلفة المشكلة وتبعاتها", points: 2 },
      { label: "عرض مزايا المنتج", points: 0 },
    ],
    explain: "أسئلة الأثر تكبّر الألم في ذهن العميل فتصبح الحاجة ملحّة.",
  },
  {
    prompt: "العميل أعلن سقف ميزانية 40 ألف. ما القيمة الصحيحة في الـCRM؟",
    options: [
      { label: "60 ألف، لأنها سعر الباقة الكاملة", points: 0 },
      { label: "قيمة ضمن 40 ألف، مع ملاحظة السقف", points: 2 },
      { label: "اتركها فارغة", points: 0 },
    ],
    explain: "الـCRM يعكس الواقع الذي سمعته، لا ما تتمنى بيعه؛ التوقعات المضخمة تضلل الفريق.",
  },
  {
    prompt: "ما أفضل إغلاق لمكالمة اكتشاف ناجحة؟",
    options: [
      { label: "«سأتواصل معك لاحقًا»", points: 0 },
      { label: "موعد محدد، بحضور صاحب القرار، ومخرج واضح للاجتماع", points: 2 },
      { label: "إرسال عرض سعر فورًا", points: 1 },
    ],
    explain: "الخطوة التالية الجيدة: متى، مع من، ولماذا.",
  },
];

// ---------- observer rubric ----------

export function correctStage(outcome: DialogueState["outcome"]): CrmStage[] {
  if (outcome === "success") return ["discovery"];
  if (outcome === "fail") return ["qualification", "lost"];
  return ["qualification"];
}

export function correctNextStep(outcome: DialogueState["outcome"]): CrmNextStep[] {
  if (outcome === "success") return ["meeting"];
  if (outcome === "fail") return ["nurture"];
  return ["email-followup"];
}

export function scoreSales(input: {
  call: DialogueState;
  hypotheses: string[];
  crm: CrmEntry;
  email: string[];
}): { scorecard: Scorecard; dealClosed: boolean } {
  const { call, crm, email } = input;
  const facts = new Set(call.facts as SalesFact[]);
  const highlights: Highlight[] = [];
  for (const entry of call.transcript) {
    if (entry.note) highlights.push({ at: clock(entry.at), tone: entry.note.tone, text: entry.note.text });
  }

  // Discovery: facts found, open questions, pre-call hypotheses.
  const correctHyp = input.hypotheses.filter((id) => hypotheses.find((h) => h.id === id)?.correct).length;
  const discovery = (facts.size / 5) * 65 + Math.min(tagCount(call, "open-question"), 5) * 4 + (correctHyp / 3) * 15;

  // Objection handling.
  // Never reaching the objections (hung up early) is not a neutral result.
  const reachedObjections = call.transcript.some((e) => e.text === salesCall.nodes["competitor-objection"].line);
  const objection =
    (reachedObjections ? 55 : 25) +
    tagCount(call, "objection-handle") * 15 +
    tagCount(call, "risk-reversal", "proof") * 8 -
    tagCount(call, "competitor-bash") * 25 -
    tagCount(call, "discount", "price-dump") * 15 -
    tagCount(call, "defensive", "overpromise") * 15;

  // Rapport & empathy: final trust, empathy moves, no pushiness.
  const rapport = call.meters.trust * 0.8 + tagCount(call, "empathy", "listen", "rapport") * 8 - tagCount(call, "pushy") * 10;

  // Closing.
  const closing = call.outcome === "success" ? 100 : call.outcome === "neutral" ? (tagCount(call, "close") ? 50 : 35) : 10;

  // CRM accuracy.
  let crmScore = 0;
  const crmNotes: string[] = [];
  if (crm.stage && correctStage(call.outcome).includes(crm.stage)) crmScore += 25;
  else crmNotes.push("مرحلة الصفقة لا تعكس نتيجة المكالمة.");
  if (crm.nextStep && correctNextStep(call.outcome).includes(crm.nextStep)) crmScore += 20;
  else crmNotes.push("الخطوة التالية المسجلة لا تطابق ما اتُّفق عليه.");
  const cap = 40_000;
  if (crm.dealValue != null && crm.dealValue > 0) {
    if (facts.has("budget") && crm.dealValue > cap) {
      crmNotes.push(`سجّلت قيمة ${crm.dealValue.toLocaleString("en-US")}$ بينما سقف الميزانية المعلن 40,000$.`);
    } else crmScore += 20;
  } else crmNotes.push("قيمة الصفقة غير مسجلة.");
  const noteScore = crmNoteOptions.reduce((sum, option) => {
    const checked = crm.notes.includes(option.id);
    const truth = option.fact !== null && facts.has(option.fact);
    if (checked && truth) return sum + 7;
    if (checked && !truth) return sum - 10;
    return sum;
  }, 0);
  crmScore += Math.max(0, Math.min(35, noteScore));
  if (crm.notes.some((id) => crmNoteOptions.find((o) => o.id === id)?.fact === null))
    crmNotes.push("سجّلت معلومة لم يقلها العميل.");
  for (const text of crmNotes) highlights.push({ at: "الـCRM", tone: "bad", text });

  // Follow-up email.
  let emailScore = 20;
  for (const id of email) {
    const block = emailBlocks.find((b) => b.id === id);
    if (!block) continue;
    if (block.wrong) {
      emailScore -= 30;
      highlights.push({ at: "الإيميل", tone: "bad", text: block.wrong });
      continue;
    }
    const valid = (block.needs ?? []).every((fact) => facts.has(fact)) && (!block.needsSuccess || call.outcome === "success");
    emailScore += valid ? 20 : -5;
  }

  // Talk ratio: 35–55 % learner is healthy.
  const share = learnerTalkShare(call);
  const talk = share <= 55 && share >= 35 ? 100 : share > 55 ? 100 - (share - 55) * 3 : 100 - (35 - share) * 3;
  highlights.push({
    at: "النسبة",
    tone: share > 60 ? "bad" : "info",
    text: `تحدثت ${share}٪ من وقت المكالمة، والعميل ${100 - share}٪.`,
  });

  const dimensions: Dimension[] = [
    {
      key: "discovery",
      label: "جودة الاكتشاف",
      score: discovery,
      weight: 3,
      skill: "analysis",
      praise: `اكتشفت ${facts.size} من 5 معلومات جوهرية عن العميل.`,
      tip: "اسأل أسئلة مفتوحة عن الوضع ثم المشكلة ثم الأثر قبل أي عرض (SPIN).",
    },
    {
      key: "objection",
      label: "التعامل مع الاعتراضات",
      score: objection,
      weight: 2,
      skill: "persuasion",
      praise: "رددت على الاعتراضات بأدلة من كلام العميل نفسه.",
      tip: "لا تهاجم المنافس ولا تقدّم خصمًا فوريًا؛ اربط ردك بالمشكلة التي اكتشفتها.",
    },
    {
      key: "rapport",
      label: "الثقة والتعاطف",
      score: rapport,
      weight: 2,
      skill: "empathy",
      praise: "بنيت ثقة واضحة وتعاملت مع غضب العميل بهدوء.",
      tip: "عند الغضب: اعترف بالشعور، ثم اسأل «ماذا حدث بالضبط؟» قبل أي دفاع.",
    },
    {
      key: "closing",
      label: "الإغلاق والخطوة التالية",
      score: closing,
      weight: 2,
      skill: "persuasion",
      praise: "أغلقت بموعد محدد مع صاحب القرار.",
      tip: "حوّل «أرسل لي إيميل» إلى سؤال: ما الذي يحتاجه صاحب القرار ليوافق؟",
    },
    {
      key: "crm",
      label: "دقة الـCRM",
      score: crmScore,
      weight: 2,
      skill: "execution",
      praise: "سجلاتك في الـCRM دقيقة ومطابقة لما قيل.",
      tip: "سجّل ما سمعته فعلًا: المرحلة الحقيقية، قيمة ضمن السقف، والخطوة المتفق عليها.",
    },
    {
      key: "email",
      label: "إيميل المتابعة",
      score: emailScore,
      weight: 1,
      skill: "communication",
      praise: "إيميل متابعة دقيق يلخّص الاتفاق دون وعود مبالغ فيها.",
      tip: "لخّص ألم العميل بكلماته، واقترح خطوة واضحة، وتجنب الوعود التي لا تملكها.",
    },
    {
      key: "talk",
      label: "نسبة الحديث والاستماع",
      score: talk,
      weight: 1,
      skill: "communication",
      praise: "حافظت على توازن صحي بين الحديث والاستماع.",
      tip: "اترك العميل يتحدث أكثر: أسئلة أقصر وعرض أقل.",
    },
  ];

  const verdict =
    call.outcome === "success"
      ? "حجزت اجتماعًا مع طارق والمدير المالي."
      : call.outcome === "fail"
        ? "أنهى طارق المكالمة قبل أن تصل إلى خطوة تالية."
        : "انتهت المكالمة بلا موعد محدد: «أرسل لي إيميل».";
  return { scorecard: buildScorecard({ dimensions, highlights, verdict }), dealClosed: call.outcome === "success" };
}
