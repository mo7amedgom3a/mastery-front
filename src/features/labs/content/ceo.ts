/**
 * CEO lab: «سلة الحي» against the new rival «فوري». Market brief and diagnosis, the board-meeting
 * graph (built from the learner's own numbers), the board report document, quizzes and rubric.
 */
import type { DocSpec } from "../components/documents/doc-types";
import { tagCount, type DialogueGraph, type DialogueState } from "../model/dialogue";
import {
  PRE_RIVAL_SHARE,
  QUARTERS,
  RUNWAY_TARGET,
  START_SHARE,
  TARGET_SHARE,
  allocationChurn,
  boardTrust,
  levers,
  quarterEvents,
  type MarketState,
} from "../model/market-sim";
import { buildScorecard, clock } from "../model/scoring";
import type { Dimension, Highlight, QuizQuestion, Scorecard } from "../model/types";

// ---------- diagnosis ----------

export const marketBrief = {
  churn: [
    ["عائلات (سلة أسبوعية > 300 ر.س)", "3.1٪", "مستقر"],
    ["أفراد (سلة < 80 ر.س)", "11.4٪", "↑ منذ إطلاق فوري"],
    ["شمال الرياض (الملقا، الياسمين، النرجس)", "9.8٪", "↑ حاد"],
    ["جدة", "4.0٪", "مستقر"],
  ],
  delivery: [
    ["سلة الحي · شمال الرياض", "68 دقيقة"],
    ["سلة الحي · جدة", "41 دقيقة"],
    ["فوري · شمال الرياض", "25 دقيقة"],
  ],
  rival: [
    ["متوسط السلة", "62 ر.س"],
    ["الخصم المتوسط لكل طلب", "18 ر.س"],
    ["الخسارة التقديرية لكل طلب", "−14 ر.س"],
    ["التمويل المتبقي (تقدير)", "يكفي 9–12 شهرًا"],
  ],
  comments: [
    "«أحب منتجاتكم بس الطلب يتأخر ساعة وأكثر، فوري يوصل بنص الوقت.»",
    "«أطلب من سنتين وما حسيت بأي تقدير، النقاط ما تسوى شي.»",
    "«فوري أرخص الحين، بس منتجاتهم الطازجة أقل.»",
    "«العائلة تطلب منكم للمقاضي الكبيرة، والطلبات الصغيرة من فوري.»",
  ],
};

export const ceoCauses: readonly { id: string; label: string; correct: boolean; why: string }[] = [
  { id: "speed", label: "بطء التوصيل في شمال الرياض (68 دقيقة مقابل 25)", correct: true, why: "" },
  { id: "small-baskets", label: "تسرب أصحاب السلال الصغيرة الحساسين للسعر والسرعة", correct: true, why: "" },
  { id: "loyalty", label: "برنامج الولاء لا يكافئ العملاء الدائمين", correct: true, why: "" },
  { id: "price-only", label: "الخصومات وحدها السبب، فيجب مطابقة السعر", correct: false, why: "العائلات لم تتسرب رغم الخصومات؛ السعر يجذب السلال الصغيرة فقط، وفوري تخسر في كل طلب." },
  { id: "app", label: "تصميم التطبيق قديم", correct: false, why: "لا شيء في البيانات أو التعليقات يشير إلى التطبيق." },
  { id: "jeddah", label: "خسارة السوق في جدة", correct: false, why: "جدة مستقرة؛ النزيف في شمال الرياض." },
  { id: "market", label: "السوق كله ينكمش", correct: false, why: "السوق ينمو؛ الحصة تنتقل إلى فوري." },
];

// ---------- board meeting ----------

const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 1 });

export function buildBoardMeeting(state: MarketState): DialogueGraph {
  const runwayLow = state.runway < 9;
  return {
    id: "board-meeting",
    title: "اجتماع مجلس الإدارة",
    start: "open",
    personas: {
      chair: { name: "م. عبدالله الراشد", role: "رئيس مجلس الإدارة", initials: "عر", tone: "purple" },
      cfo: { name: "نورة القحطاني", role: "عضو المجلس · رئيسة لجنة المراجعة", initials: "نق", tone: "teal" },
    },
    initial: { trust: boardTrust(state), patience: 60, tension: 40 },
    visibleMeters: ["trust", "patience"],
    turnCost: { patience: -8 },
    breakpoints: [{ when: (s) => s.meters.patience <= 0, to: "cut-off" }],
    nodes: {
      open: {
        id: "open",
        speaker: "chair",
        line: `أربعة أرباع مرّت. حصتنا الآن ${fmt(state.share)}٪، والنقد ${fmt(state.cash)} مليون يكفي ${fmt(state.runway)} شهرًا. ابدأ: ما الذي حدث؟`,
        choices: [
          {
            id: "facts",
            label: "أبدأ بالحقيقة: شخّصنا أن النزيف من بطء التوصيل في شمال الرياض وضعف الولاء، لا السعر وحده. هذه أرقام كل ربع، وما نجح وما لم ينجح.",
            tags: ["data", "ownership"],
            effects: { trust: 10 },
            next: "cfo-gate",
            note: { tone: "good", text: "افتتح بالبيانات وتحمّل المسؤولية عن النتائج." },
          },
          {
            id: "excuse",
            label: "السوق صعب جدًا، وفوري تحرق أموال المستثمرين. أي أحد مكاني كان سيخسر.",
            tags: ["excuse"],
            effects: { trust: -15 },
            next: "press",
            note: { tone: "bad", text: "بدأ بالأعذار أمام المجلس." },
          },
          {
            id: "slides",
            label: "جهزت عرضًا من 40 شريحة، دعوني أبدأ من تاريخ السوق منذ 2019…",
            tags: ["rambling"],
            effects: { patience: -35 },
            next: "press",
            note: { tone: "bad", text: "أضاع وقت المجلس بعرض طويل بلا خلاصة." },
          },
        ],
      },
      press: {
        id: "press",
        speaker: "chair",
        line: "لم نأتِ لنسمع مقدمات. الأرقام والقرارات، من فضلك.",
        choices: [
          {
            id: "recover",
            label: "معك حق. باختصار: ركزنا على السرعة والولاء، والنتيجة في الجدول أمامكم ربعًا بربع.",
            tags: ["data", "recovery"],
            effects: { trust: 6 },
            next: "cfo-gate",
          },
          {
            id: "blame-team",
            label: "فريق العمليات لم ينفذ الخطة كما يجب.",
            tags: ["blame"],
            effects: { trust: -15 },
            next: "cfo-gate",
            note: { tone: "bad", text: "حمّل الفريق المسؤولية أمام المجلس." },
          },
        ],
      },
      "cfo-gate": {
        id: "cfo-gate",
        speaker: "cfo",
        line: "…",
        redirect: [
          { when: () => runwayLow, to: "cfo-cash" },
          { when: () => true, to: "cfo-price" },
        ],
      },
      "cfo-cash": {
        id: "cfo-cash",
        speaker: "cfo",
        line: `النقد يكفي ${fmt(state.runway)} شهرًا فقط. لماذا لا نوقف كل الصرف الآن؟`,
        choices: [
          {
            id: "cash-plan",
            label: "إيقاف كل الصرف يقتل النمو. أقترح: نوقف الخصومات فورًا، ونبقي الاستثمار في التوصيل والولاء، ونطلب مراجعة شهرية للنقد.",
            tags: ["data", "plan"],
            effects: { trust: 10 },
            next: "ask",
            note: { tone: "good", text: "قدّم خطة نقد واضحة بدل الدفاع." },
          },
          { id: "raise", label: "سنجمع جولة تمويل جديدة.", tags: ["vague"], effects: { trust: -10 }, next: "ask", note: { tone: "bad", text: "وعد بتمويل دون خطة." } },
          { id: "defend", label: "قراراتي كانت صحيحة، والنتائج ستأتي.", tags: ["defensive"], effects: { trust: -15 }, next: "ask" },
        ],
      },
      "cfo-price": {
        id: "cfo-price",
        speaker: "cfo",
        line: "فوري كانت تخصم 30٪. لماذا لم نطابق السعر ونحسم المعركة مبكرًا؟",
        choices: [
          {
            id: "economics",
            label: "لأن فوري تخسر قرابة 14 ريالًا في كل طلب، ومطابقتها تحرق نقدنا على كل الطلبات. استثمرنا فيما يبقي العميل: السرعة والولاء.",
            tags: ["data", "strategy"],
            effects: { trust: 12 },
            next: "ask",
            note: { tone: "good", text: "دافع عن الاستراتيجية باقتصاديات الوحدة." },
          },
          { id: "flip", label: "معك حق، كان يجب أن نطابق.", tags: ["flip"], effects: { trust: -5 }, next: "ask", note: { tone: "bad", text: "تراجع عن استراتيجيته عند أول سؤال صعب." } },
          { id: "defend-price", label: "القرار كان قراري، ولا أحتاج تبريره.", tags: ["defensive"], effects: { trust: -15 }, next: "ask" },
        ],
      },
      ask: {
        id: "ask",
        speaker: "chair",
        line: "حسنًا. ماذا تطلب للسنة القادمة؟",
        choices: [
          {
            id: "kpi-ask",
            label: "ميزانية بنفس المستوى مربوطة بثلاثة مؤشرات: الحصة، زمن التوصيل، ونقد يكفي 12 شهرًا على الأقل، مع مراجعة ربعية.",
            tags: ["ask", "kpi"],
            effects: { trust: 10 },
            next: "decide",
            note: { tone: "good", text: "طلب محدد مربوط بمؤشرات قابلة للمحاسبة." },
          },
          { id: "double", label: "أطلب مضاعفة الميزانية لحرب أسعار تقضي على فوري.", tags: ["aggressive"], effects: { trust: -15 }, next: "decide", note: { tone: "bad", text: "طلب مضاعفة الصرف على أداة أثبتت أنها تحرق النقد." } },
          { id: "whatever", label: "ما ترونه مناسبًا.", tags: ["passive"], effects: { trust: -5 }, next: "decide" },
        ],
      },
      decide: {
        id: "decide",
        speaker: "chair",
        line: "…",
        redirect: [
          { when: (s) => s.meters.trust >= 65, to: "approved" },
          { when: (s) => s.meters.trust >= 40, to: "conditional" },
          { when: () => true, to: "rejected" },
        ],
      },
      approved: { id: "approved", speaker: "chair", line: "المجلس يعتمد الخطة والميزانية. أحسنت قراءة السوق.", end: "success" },
      conditional: { id: "conditional", speaker: "chair", line: "نعتمد نصف الميزانية الآن، والباقي بعد مراجعة الربع الأول.", end: "neutral" },
      rejected: { id: "rejected", speaker: "cfo", line: "المجلس سيعيّن مستشارًا لمراجعة الاستراتيجية. لا ميزانية جديدة حاليًا.", end: "fail" },
      "cut-off": { id: "cut-off", speaker: "chair", line: "نفد وقتنا. أرسل ملخصًا من صفحة واحدة، وسنقرر بدونك.", end: "fail" },
    },
  };
}

// ---------- board report ----------

const eventLabel = (quarter: number, choice: string) =>
  quarterEvents.find((e) => e.quarter === quarter)?.choices.find((c) => c.id === choice)?.label ?? choice;

export function boardReport(state: MarketState, signed: boolean): DocSpec {
  const last = state.history.at(-1);
  return {
    title: "تقرير الرئيس التنفيذي لمجلس الإدارة",
    subtitle: `الاستجابة لدخول «فوري» · ${QUARTERS} أرباع`,
    ref: "SLH-BRD-2026-Q4",
    date: "12 نوفمبر 2026",
    issuer: { name: "سلة الحي", tagline: "توصيل البقالة · الرياض وجدة", color: "green" },
    pages: [
      [
        {
          heading: "الملخص التنفيذي",
          blocks: [
            {
              kind: "table",
              head: ["المؤشر", "قبل فوري", "البداية", "النهاية"],
              rows: [
                ["الحصة السوقية", `${PRE_RIVAL_SHARE}%`, `${START_SHARE}%`, `${fmt(state.share)}%`],
                ["النقد (مليون ر.س)", "—", "75", fmt(state.cash)],
                ["مدة النقد (شهر)", "—", "30", fmt(state.runway)],
                ["رضا العملاء NPS", "—", "31", String(state.nps)],
                ["معنويات الفريق", "—", "64", String(state.morale)],
                ["زمن التوصيل (دقيقة)", "—", "68", String(state.deliveryMinutes)],
              ],
            },
            {
              kind: "callout",
              tone: state.share >= TARGET_SHARE && state.runway >= RUNWAY_TARGET ? "good" : "warn",
              text:
                state.share >= TARGET_SHARE && state.runway >= RUNWAY_TARGET
                  ? `استعدنا الحصة إلى ${fmt(state.share)}٪ مع نقد يكفي ${fmt(state.runway)} شهرًا.`
                  : `الهدف كان ${TARGET_SHARE}٪ حصة ونقدًا يكفي ${RUNWAY_TARGET} شهرًا؛ النتيجة ${fmt(state.share)}٪ و${fmt(state.runway)} شهرًا.`,
            },
          ],
        },
        {
          heading: "الأداء ربعًا بربع",
          blocks: [
            {
              kind: "table",
              head: ["الربع", "الحصة", "الإيراد", "الربح/الخسارة", "النقد", "NPS"],
              rows: state.history.map((h) => [`ر${h.quarter}`, `${fmt(h.share)}%`, fmt(h.revenue), fmt(h.profit), fmt(h.cash), String(h.nps)]),
            },
            { kind: "paragraph", muted: true, text: "المبالغ بملايين الريالات." },
          ],
        },
      ],
      [
        {
          heading: "توزيع الميزانية والقرارات",
          blocks: [
            {
              kind: "table",
              head: ["الأداة", ...state.history.map((h) => `ر${h.quarter}`)],
              rows: levers.map((lever) => [lever.label, ...state.history.map((h) => `${h.allocation[lever.id]}%`)]),
            },
            {
              kind: "table",
              head: ["الربع", "الحدث", "القرار"],
              rows: state.history.map((h) => [`ر${h.quarter}`, quarterEvents[h.quarter - 1]?.title ?? "", eventLabel(h.quarter, h.eventChoice)]),
            },
          ],
        },
        {
          heading: "التوصية",
          blocks: [
            {
              kind: "paragraph",
              text: last
                ? `نوصي بالاستمرار في الاستثمار في سرعة التوصيل (${last.deliveryMinutes} دقيقة حاليًا) والولاء، وإيقاف أي خصومات عامة، وربط ميزانية العام القادم بثلاثة مؤشرات: الحصة، زمن التوصيل، ومدة النقد.`
                : "",
            },
            {
              kind: "signatures",
              parties: [
                { role: "الرئيس التنفيذي", name: "أنت", signed: true },
                { role: "رئيس مجلس الإدارة", name: "م. عبدالله الراشد", signed },
              ],
            },
          ],
        },
      ],
    ],
    footer: "سلة الحي · سري · لأعضاء المجلس فقط",
  };
}

// ---------- quizzes ----------

export const ceoPreQuiz: readonly QuizQuestion[] = [
  {
    prompt: "منافس ممول جيدًا يدخل السوق بخصم 30٪. ردك الأول؟",
    options: [
      { label: "نطابق السعر فورًا قبل أن نخسر العملاء", points: 0, style: "assertive" },
      { label: "نحلل من يغادر ولماذا قبل أي قرار", points: 2, style: "analytical" },
      { label: "ننتظر حتى تنفد أموالهم", points: 1, style: "avoidant" },
    ],
    explain: "التشخيص أولًا: ليس كل العملاء يغادرون للسبب نفسه.",
  },
  {
    prompt: "المنافس يخسر 14 ريالًا في كل طلب. ماذا يعني ذلك لك؟",
    options: [
      { label: "ميزته مؤقتة ما لم يجد تمويلًا جديدًا", points: 2, style: "analytical" },
      { label: "يجب أن نخسر مثله لنبقى", points: 0, style: "assertive" },
      { label: "لا يهم", points: 0, style: "avoidant" },
    ],
    explain: "اقتصاديات الوحدة تكشف إن كانت الميزة مستدامة.",
  },
  {
    prompt: "المجلس يطالب بتسريح 15٪. أفضل تصرف؟",
    options: [
      { label: "أنفذ كما طُلب", points: 1, style: "avoidant" },
      { label: "أقترح خفضًا موجهًا يحمي القدرات التي تصنع الميزة", points: 2, style: "collaborative" },
      { label: "أرفض دون بديل", points: 0, style: "assertive" },
    ],
    explain: "حماية النقد والميزة التنافسية معًا تتطلب خفضًا ذكيًا لا شاملًا.",
  },
  {
    prompt: "متى يكون تغيير الاستراتيجية كل ربع خطأ؟",
    options: [
      { label: "عندما تحتاج الأدوات وقتًا لتؤتي ثمارها كسرعة التوصيل والولاء", points: 2, style: "analytical" },
      { label: "أبدًا، المرونة دائمًا أفضل", points: 0, style: "assertive" },
      { label: "عندما يعترض الفريق", points: 0, style: "avoidant" },
    ],
    explain: "التذبذب يهدر الاستثمارات طويلة الأجل قبل أن تنضج.",
  },
  {
    prompt: "أمام مجلس الإدارة بعد سنة صعبة، تبدأ بـ:",
    options: [
      { label: "الأرقام والقرارات وما تعلمناه", points: 2, style: "analytical" },
      { label: "صعوبة السوق", points: 0, style: "avoidant" },
      { label: "عرض تفصيلي طويل", points: 0, style: "assertive" },
    ],
    explain: "المجلس يريد الحقيقة مختصرة ثم الخطة.",
  },
];

export const ceoPostQuiz: readonly QuizQuestion[] = [
  {
    prompt: "لماذا تبخرت الحصة التي جلبتها الخصومات؟",
    options: [
      { label: "لأن المنافس طابقها، وعملاء السعر لا يبقون حين يتوقف الخصم", points: 2 },
      { label: "لأن التسويق ضعيف", points: 0 },
      { label: "لم تتبخر", points: 0 },
    ],
    explain: "الحصة المشتراة بالسعر مستأجرة، لا مملوكة.",
  },
  {
    prompt: "ما مؤشر «مدة النقد» (Runway)؟",
    options: [
      { label: "النقد ÷ الحرق الشهري", points: 2 },
      { label: "الإيراد ÷ التكاليف", points: 0 },
      { label: "عدد الأشهر حتى الربحية", points: 0 },
    ],
    explain: "كم شهرًا تعيش الشركة بالنقد الحالي إن استمر الحرق.",
  },
  {
    prompt: "عندما فشلت جولة تمويل المنافس، ما الذي جعل حملة الاستعادة تنجح؟",
    options: [
      { label: "رضا عملائنا المرتفع (NPS) بعد تحسين التوصيل والولاء", points: 2 },
      { label: "حجم الحملة", points: 0 },
      { label: "الحظ", points: 0 },
    ],
    explain: "العملاء يعودون إلى من خدمهم جيدًا، لا إلى الأعلى صوتًا.",
  },
];

// ---------- observer rubric ----------

export function scoreCeo(input: { market: MarketState; causes: readonly string[]; board: DialogueState }): {
  scorecard: Scorecard;
  shareDefended: boolean;
} {
  const { market, causes, board } = input;
  const highlights: Highlight[] = [];

  const correct = ceoCauses.filter((c) => c.correct);
  const hits = causes.filter((id) => correct.some((c) => c.id === id)).length;
  const wrong = causes.filter((id) => !correct.some((c) => c.id === id));
  const diagnosis = (hits / correct.length) * 100 - wrong.length * 25;
  for (const id of wrong) {
    const cause = ceoCauses.find((c) => c.id === id);
    if (cause) highlights.push({ at: "التشخيص", tone: "bad", text: `«${cause.label}»: ${cause.why}` });
  }

  for (const h of market.history) {
    const at = `الربع ${h.quarter}`;
    if (h.allocation.price >= 40) highlights.push({ at, tone: "bad", text: `خصصت ${h.allocation.price}٪ للخصومات: حصة مؤقتة يطابقها المنافس، وحرق نقد على كل طلب.` });
    if (h.allocation.delivery + h.allocation.loyalty >= 50)
      highlights.push({ at, tone: "good", text: "استثمرت في السرعة والولاء: حصة أبطأ لكنها تبقى." });
    if (h.eventChoice === "comply") highlights.push({ at, tone: "bad", text: "التسريح الشامل وفّر نقدًا لكنه ضرب المعنويات وسرعة التوصيل." });
    if (h.eventChoice === "acquire") highlights.push({ at, tone: "bad", text: "الاستحواذ على منافس يحتضر استنزف النقد مقابل عملاء كانوا سيأتون أصلًا." });
    if (h.eventChoice === "winback" && h.nps >= 40) highlights.push({ at, tone: "good", text: "حملة الاستعادة نجحت لأن رضا عملائك كان مرتفعًا." });
    if (h.runway < 6) highlights.push({ at, tone: "bad", text: `النقد يكفي ${h.runway} شهرًا فقط: الشركة في خطر.` });
  }
  for (const entry of board.transcript) {
    if (entry.note) highlights.push({ at: `المجلس ${clock(entry.at)}`, tone: entry.note.tone, text: entry.note.text });
  }

  const share = ((market.share - 25) / (PRE_RIVAL_SHARE - 25)) * 100;
  const cash = market.runway >= RUNWAY_TARGET ? 100 : (market.runway / RUNWAY_TARGET) * 100;
  const nps = ((market.nps - 15) / 50) * 100;
  const consistency = 100 - allocationChurn(market.history) * 2.5;
  const boardScore =
    (board.outcome === "success" ? 80 : board.outcome === "neutral" ? 50 : 15) +
    tagCount(board, "data", "strategy", "kpi", "plan") * 5 -
    tagCount(board, "excuse", "blame", "defensive", "flip", "rambling") * 8;

  const dimensions: Dimension[] = [
    {
      key: "share",
      label: "استعادة الحصة",
      score: share,
      weight: 3,
      skill: "strategy",
      praise: `استعدت الحصة إلى ${fmt(market.share)}٪.`,
      tip: "الحصة المستدامة تأتي من سبب يجعل العميل يبقى (سرعة، ولاء)، لا من خصم يطابقه المنافس.",
    },
    {
      key: "cash",
      label: "الانضباط النقدي",
      score: cash,
      weight: 2,
      skill: "decision",
      praise: `أنهيت السنة بنقد يكفي ${fmt(market.runway)} شهرًا.`,
      tip: "راقب مدة النقد كل ربع؛ تحت 12 شهرًا يجب أن يتغير شكل الإنفاق.",
    },
    {
      key: "nps",
      label: "صحة العملاء (NPS)",
      score: nps,
      weight: 1.5,
      skill: "analysis",
      praise: `رضا العملاء ارتفع إلى ${market.nps}.`,
      tip: "التعليقات قالت السبب: التوصيل والتقدير. استثمر فيما يشتكي منه العملاء فعلًا.",
    },
    {
      key: "morale",
      label: "معنويات الفريق",
      score: market.morale,
      weight: 1,
      skill: "empathy",
      praise: "حافظت على فريق متحمس في سنة صعبة.",
      tip: "خفض التكاليف الشامل والتسريح يضربان الفريق الذي ينفّذ الخطة؛ اجعل الخفض موجّهًا.",
    },
    {
      key: "consistency",
      label: "اتساق الاستراتيجية",
      score: consistency,
      weight: 1,
      skill: "strategy",
      praise: "استراتيجية ثابتة أعطت الاستثمارات وقتًا لتنضج.",
      tip: "لا تقلب التوزيع كل ربع؛ اختر رهانًا واضحًا وعدّل بهدوء.",
    },
    {
      key: "diagnosis",
      label: "دقة التشخيص",
      score: diagnosis,
      weight: 1.5,
      skill: "analysis",
      praise: "قرأت بيانات السوق وحددت أسباب النزيف الحقيقية.",
      tip: "قارن الشرائح: من يغادر؟ أين؟ ولماذا؟ قبل أن تقرر الدواء.",
    },
    {
      key: "board",
      label: "التواصل مع المجلس",
      score: boardScore,
      weight: 1.5,
      skill: "communication",
      praise: "عرضت النتائج بالأرقام وطلبت ميزانية مربوطة بمؤشرات.",
      tip: "أمام المجلس: الحقيقة أولًا، ثم المنطق الاقتصادي، ثم طلب محدد قابل للمحاسبة.",
    },
  ];

  const shareDefended = market.share >= TARGET_SHARE && market.runway >= RUNWAY_TARGET;
  const verdict = shareDefended
    ? `استعدت الحصة إلى ${fmt(market.share)}٪ مع نقد يكفي ${fmt(market.runway)} شهرًا.`
    : market.runway < 6
      ? `الحصة ${fmt(market.share)}٪ لكن النقد يكفي ${fmt(market.runway)} شهرًا فقط.`
      : `الحصة ${fmt(market.share)}٪ والهدف ${TARGET_SHARE}٪.`;
  return { scorecard: buildScorecard({ dimensions, highlights, verdict }), shareDefended };
}
