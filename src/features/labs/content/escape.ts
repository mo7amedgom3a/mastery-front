/**
 * Audit escape-room lab: before «نقطة» acquires the distributor «الواحة للتوزيع», the
 * due-diligence team has 45 simulated minutes to open five locks — materiality, a fictitious
 * vendor, revenue cut-off, an undisclosed related party and a suspicious manual entry — then
 * recommend whether to proceed.
 */
import type { DocSpec } from "../components/documents/doc-types";
import { roomSummary, ROOM_MINUTES, type Lock, type RoomState } from "../model/escape-locks";
import { buildScorecard } from "../model/scoring";
import type { Dimension, Highlight, QuizQuestion, Scorecard } from "../model/types";
import { company, money, people } from "./nuqta/company";

export const TARGET = "الواحة للتوزيع";

export type Evidence = { title: string; head: readonly string[]; rows: readonly (readonly string[])[]; note?: string };

export type EscapeLock = Lock & { story: string; question: string; evidence: readonly Evidence[]; finding: string; unit: string };

export const locks: readonly EscapeLock[] = [
  {
    id: "materiality",
    title: "القفل 1 · الأهمية النسبية",
    story: "قبل أي اختبار نحتاج حد الأهمية الذي نقيس به التحريفات. منهجية المكتب: 5٪ من الربح قبل الزكاة لمنشأة هادفة للربح.",
    question: "ما مبلغ الأهمية النسبية الإجمالية (ر.س)؟",
    unit: "ر.س",
    evidence: [
      {
        title: "قائمة الدخل المختصرة · 2025",
        head: ["البند", "المبلغ (ر.س)"],
        rows: [
          ["الإيرادات", "48,000,000"],
          ["تكلفة المبيعات", "(39,100,000)"],
          ["مصروفات تشغيلية", "(5,700,000)"],
          ["صافي الربح بعد الزكاة", "2,880,000"],
          ["الزكاة", "320,000"],
          ["إجمالي الأصول", "21,000,000"],
        ],
      },
    ],
    code: "160000",
    work: 5,
    hints: ["الربح قبل الزكاة = صافي الربح + الزكاة.", "2,880,000 + 320,000 = 3,200,000؛ ثم اضرب في 5٪."],
    finding: "الأهمية النسبية 160,000 ر.س (5٪ من ربح قبل الزكاة 3.2 مليون).",
  },
  {
    id: "vendor",
    title: "القفل 2 · المورد الوهمي",
    story: "مدفوعات الموردين ارتفعت 18٪ دون زيادة في المخزون. قارن ملف الموردين بملف الموظفين.",
    question: "ما رقم المورد الوهمي (الأرقام فقط)؟",
    unit: "رقم المورد",
    evidence: [
      {
        title: "ملف الموردين (مقتطف)",
        head: ["الرقم", "المورد", "الآيبان", "المدفوع 2025"],
        rows: [
          ["V-1012", "مصنع التمور الذهبية", "SA03 8000 0000 6080 1016 7519", "6,240,000"],
          ["V-1033", "شركة النقل السريع", "SA44 2000 0001 2345 6789 1234", "1,880,000"],
          ["V-1047", "مؤسسة الإمداد المتكامل", "SA71 1000 0000 7788 9900 4411", "1,420,000"],
          ["V-1052", "مطابع الرياض", "SA19 4500 0000 1111 2222 3333", "310,000"],
        ],
      },
      {
        title: "ملف الرواتب (مقتطف)",
        head: ["الموظف", "الوظيفة", "آيبان الراتب"],
        rows: [
          ["خالد السالم", "مدير المشتريات", "SA71 1000 0000 7788 9900 4411"],
          ["منى العتيبي", "محاسبة", "SA55 1500 0000 3434 5656 7878"],
        ],
      },
    ],
    code: "1047",
    work: 7,
    hints: ["ابحث عن آيبان مكرر بين الملفين.", "آيبان مدير المشتريات يظهر في ملف الموردين."],
    finding: "المورد V-1047 يستلم مدفوعاته (1.42 مليون) على آيبان راتب مدير المشتريات: مؤشر احتيال مدفوعات.",
  },
  {
    id: "cutoff",
    title: "القفل 3 · قطع الإيرادات",
    story: "الإيراد يُثبت عند تسليم البضاعة. راجع فواتير آخر الأسبوع من السنة وأول الأسبوع من الجديدة.",
    question: "كم ريالًا سُجل إيرادًا في 2025 بينما سُلّم في 2026؟",
    unit: "ر.س",
    evidence: [
      {
        title: "فواتير حول نهاية السنة",
        head: ["الفاتورة", "تاريخ الفاتورة", "تاريخ التسليم", "المبلغ (ر.س)"],
        rows: [
          ["INV-8811", "28/12/2025", "29/12/2025", "195,000"],
          ["INV-8814", "30/12/2025", "04/01/2026", "412,500"],
          ["INV-8815", "31/12/2025", "31/12/2025", "88,000"],
          ["INV-8816", "31/12/2025", "06/01/2026", "268,000"],
          ["INV-8820", "02/01/2026", "02/01/2026", "150,000"],
        ],
      },
    ],
    code: "680500",
    work: 8,
    hints: ["الفواتير المؤرخة في 2025 مع تسليم في 2026 فقط.", "INV-8814 + INV-8816."],
    finding: "680,500 ر.س إيرادات سُجلت مبكرًا (قبل التسليم): تحريف يتجاوز الأهمية النسبية بأربعة أضعاف.",
  },
  {
    id: "related",
    title: "القفل 4 · الطرف ذو العلاقة",
    story: "الإيضاحات تقول: «لا توجد معاملات مع أطراف ذات علاقة». قارن المؤجر بسجل الملكية.",
    question: "كم يبلغ الإيجار السنوي المدفوع للطرف ذي العلاقة غير المفصح عنه (ر.س)؟",
    unit: "ر.س",
    evidence: [
      {
        title: "عقود الإيجار",
        head: ["الموقع", "المؤجر", "الإيجار السنوي"],
        rows: [
          ["مستودع السلي", "شركة أملاك المدار", "540,000"],
          ["المكتب الرئيس", "صندوق ريت التجاري", "380,000"],
        ],
      },
      {
        title: "بيانات الملاك من السجل التجاري",
        head: ["المنشأة", "المالك"],
        rows: [
          ["شركة أملاك المدار", "نوال الفهد (100٪)"],
          ["الواحة للتوزيع", "سعد الفهد (60٪) · آخرون (40٪)"],
        ],
        note: "الرئيس التنفيذي للواحة: سعد الفهد. نوال الفهد زوجته (من إقرار الذمة).",
      },
    ],
    code: "540000",
    work: 7,
    hints: ["من يملك شركة أملاك المدار؟", "زوجة الرئيس التنفيذي طرف ذو علاقة؛ الإيجار 540 ألفًا."],
    finding: "إيجار 540,000 ر.س سنويًا لشركة تملكها زوجة الرئيس التنفيذي دون إفصاح أو مقارنة بسعر السوق.",
  },
  {
    id: "journal",
    title: "القفل 5 · القيد اليدوي المشبوه",
    story: "اختبار القيود اليدوية بعد الإقفال. ابحث عن علامات الخطر: توقيت غير معتاد، مبلغ مقرّب تحت حد الاعتماد، حساب معلّق، بلا وصف.",
    question: "ما رقم القيد المشبوه (الأرقام فقط)؟",
    unit: "رقم القيد",
    evidence: [
      {
        title: "قيود يدوية مرحّلة على فترة ديسمبر 2025",
        head: ["القيد", "التاريخ والوقت", "المُدخل", "مدين ← دائن", "المبلغ", "الوصف"],
        rows: [
          ["JE-9902", "الاثنين 29/12 · 10:15", "منى", "مصروف كهرباء ← مستحقات", "41,230", "فاتورة ديسمبر"],
          ["JE-9917", "الأربعاء 31/12 · 14:02", "منى", "إهلاك ← مجمع الإهلاك", "212,775", "إهلاك ديسمبر"],
          ["JE-9931", "السبت 03/01 · 23:41", "المدير المالي", "معلّق ← الإيرادات", "249,000", "—"],
          ["JE-9938", "الأربعاء 31/12 · 16:30", "منى", "رواتب ← مستحقات", "96,400", "رواتب ديسمبر"],
        ],
        note: "حد اعتماد القيود اليدوية دون موافقة ثانية: 250,000 ر.س.",
      },
    ],
    code: "9931",
    work: 6,
    hints: ["قيد في عطلة نهاية الأسبوع وفي منتصف الليل.", "249,000 تحت حد 250,000 مباشرة، من حساب معلّق إلى الإيرادات، بلا وصف."],
    finding: "القيد JE-9931 (249,000) أُدخل ليلة سبت بعد الإقفال من حساب معلّق إلى الإيرادات بلا وصف وتحت حد الاعتماد.",
  },
];

export const recommendations: readonly { id: string; label: string; detail: string; points: (solved: number) => number }[] = [
  {
    id: "conditions",
    label: "نستمر بشروط: خفض السعر، ضمانات وتعويضات، وتحقيق جنائي قبل الإغلاق",
    detail: "تعديل التقييم بالتحريفات المكتشفة، وحساب ضمان، وشرط إنهاء خدمات المتورطين.",
    points: (solved) => (solved >= 4 ? 100 : solved >= 2 ? 70 : 40),
  },
  {
    id: "walk",
    label: "ننسحب من الصفقة",
    detail: "مخاطر النزاهة في الإدارة أكبر من فائدة الاستحواذ.",
    points: (solved) => (solved >= 4 ? 75 : 45),
  },
  {
    id: "proceed",
    label: "نكمل بالسعر المتفق عليه؛ الفروقات صغيرة نسبةً للصفقة",
    detail: "إغلاق سريع قبل نهاية الربع.",
    points: () => 0,
  },
];

// ---------- findings memo ----------

export function findingsMemo(state: RoomState, recommendation: string): DocSpec {
  const summary = roomSummary(locks, state);
  return {
    title: "مذكرة نتائج الفحص النافي للجهالة",
    subtitle: `استحواذ ${company.name} على ${TARGET}`,
    ref: "NQT-DD-2026-04",
    date: "نوفمبر 2026",
    issuer: { name: company.name, tagline: "فريق الاستحواذ · سري للغاية", color: "lilac" },
    pages: [
      [
        {
          heading: "النتائج",
          blocks: [
            {
              kind: "table",
              head: ["الاختبار", "الحالة", "النتيجة"],
              rows: locks.map((lock) => {
                const p = state.progress[lock.id];
                return [lock.title, p?.solved ? "مكتمل" : p?.skipped ? "متروك" : "لم يُختبر", p?.solved ? lock.finding : "—"];
              }),
            },
            {
              kind: "fields",
              fields: [
                { label: "الأقفال المفتوحة", value: `${summary.solved} / ${locks.length}` },
                { label: "الوقت المتبقي", value: `${summary.left} من ${ROOM_MINUTES} دقيقة` },
                { label: "التلميحات", value: String(summary.hints) },
                { label: "محاولات خاطئة", value: String(summary.wrong) },
              ],
            },
          ],
        },
        {
          heading: "التوصية",
          blocks: [
            { kind: "paragraph", text: recommendations.find((r) => r.id === recommendation)?.label ?? "—" },
            {
              kind: "callout",
              tone: recommendation === "proceed" ? "warn" : "info",
              text:
                recommendation === "proceed"
                  ? "تحذير: الإكمال دون معالجة النتائج يعني شراء تحريف في الإيرادات واحتيال مدفوعات قائمًا."
                  : `التحريفات المكمّية: ${money(680_500)} قطع إيرادات + ${money(249_000)} قيد يدوي، إضافة إلى مدفوعات مشبوهة بقيمة ${money(1_420_000)}.`,
            },
            {
              kind: "signatures",
              parties: [
                { role: "مدقق الفحص", name: "أنت", signed: true },
                { role: "شريك المراجعة", name: people.auditor.name, signed: summary.solved >= 4 },
              ],
            },
          ],
        },
      ],
    ],
    footer: `${company.name} · سري للغاية · لأغراض الاستحواذ`,
  };
}

// ---------- quizzes ----------

export const escapePreQuiz: readonly QuizQuestion[] = [
  {
    prompt: "مورد يستلم مدفوعاته على آيبان موظف. ماذا يعني ذلك؟",
    options: [
      { label: "مؤشر قوي على مورد وهمي يحتاج تحقيقًا", points: 2, style: "analytical" },
      { label: "خطأ إدخال بسيط", points: 0, style: "avoidant" },
      { label: "أواجه الموظف فورًا", points: 1, style: "assertive" },
    ],
    explain: "تطابق بيانات بنكية بين ملفي الموردين والرواتب من أشهر مؤشرات الاحتيال.",
  },
  {
    prompt: "قيد يدوي بمبلغ تحت حد الاعتماد مباشرة وبلا وصف:",
    options: [
      { label: "علامة خطر تستحق الاختبار", points: 2, style: "analytical" },
      { label: "طبيعي في نهاية السنة", points: 0, style: "avoidant" },
      { label: "لا يهم إن كان المبلغ صغيرًا", points: 0, style: "avoidant" },
    ],
    explain: "تجنب حد الاعتماد عمدًا من أنماط التحايل على الضوابط.",
  },
  {
    prompt: "الوقت ينفد وقفل صعب أمامك. ماذا تفعل؟",
    options: [
      { label: "تلميح محسوب أو تجاوز مؤقت ثم العودة للأهم", points: 2, style: "collaborative" },
      { label: "أخمّن أرقامًا حتى ينفتح", points: 0, style: "assertive" },
      { label: "أتوقف", points: 0, style: "avoidant" },
    ],
    explain: "إدارة الوقت جزء من الفحص: التخمين يستهلك الوقت ولا يبني دليلًا.",
  },
];

export const escapePostQuiz: readonly QuizQuestion[] = [
  {
    prompt: "قطع الإيرادات يختبر:",
    options: [
      { label: "أن الإيراد سُجل في الفترة التي حدث فيها التسليم", points: 2 },
      { label: "أن الفواتير مرقمة", points: 0 },
      { label: "أن العملاء دفعوا", points: 0 },
    ],
    explain: "الإيراد يتبع انتقال السيطرة، لا تاريخ الفاتورة.",
  },
  {
    prompt: "معاملة إيجار مع شركة تملكها زوجة الرئيس التنفيذي:",
    options: [
      { label: "معاملة مع طرف ذي علاقة تتطلب إفصاحًا واعتمادًا مستقلًا", points: 2 },
      { label: "مقبولة إن كان السعر عادلًا دون إفصاح", points: 0 },
      { label: "ليست ذات علاقة لأن الزوجة ليست موظفة", points: 0 },
    ],
    explain: "أفراد العائلة المقربون من الأطراف ذات العلاقة.",
  },
  {
    prompt: "التحريفات المكتشفة تفوق الأهمية النسبية. توصيتك للاستحواذ:",
    options: [
      { label: "تعديل السعر وضمانات وشروط قبل الإغلاق، أو الانسحاب", points: 2 },
      { label: "الإغلاق كما هو", points: 0 },
      { label: "تأجيل الفحص لما بعد الإغلاق", points: 0 },
    ],
    explain: "الفحص قبل الإغلاق هو آخر فرصة لتسعير المخاطر.",
  },
];

// ---------- run + rubric ----------

export type EscapeRun = { state: RoomState; recommendation: string };

export function scoreEscape(run: EscapeRun): { scorecard: Scorecard; escapeArtist: boolean } {
  const summary = roomSummary(locks, run.state);
  const highlights: Highlight[] = [];
  for (const lock of locks) {
    const p = run.state.progress[lock.id];
    if (p?.solved) highlights.push({ at: lock.title, tone: p.hints ? "info" : "good", text: lock.finding + (p.hints ? ` (بعد ${p.hints} تلميح)` : "") });
    else highlights.push({ at: lock.title, tone: "bad", text: p?.skipped ? "تُرك القفل: نتيجة لم تُكتشف قبل الإغلاق." : "انتهى الوقت قبل الوصول لهذا القفل." });
  }
  const rec = recommendations.find((r) => r.id === run.recommendation);
  if (run.recommendation === "proceed") highlights.push({ at: "التوصية", tone: "bad", text: "أوصيت بالإكمال رغم تحريفات واحتيال مكتشف." });

  const dimensions: Dimension[] = [
    { key: "locks", label: "اكتشاف المخالفات", score: (summary.solved / locks.length) * 100, weight: 3, skill: "analysis", praise: "كشفت المخالفات الخمس بالأدلة.", tip: "طابق الملفات ببعضها: الموردين بالرواتب، الفواتير بالتسليم، الملاك بالمؤجرين." },
    { key: "time", label: "إدارة الوقت", score: (summary.left / ROOM_MINUTES) * 100 + 40, weight: 1, skill: "execution", praise: "أنهيت الفحص بوقت متبقٍ.", tip: "ابدأ بما يحدد الباقي (الأهمية النسبية) وتجاوز المتعثر مؤقتًا." },
    { key: "accuracy", label: "دقة الإجابات", score: 100 - summary.wrong * 15, weight: 1.5, skill: "decision", praise: "إجابات مبنية على حساب لا تخمين.", tip: "احسب قبل أن تُدخل الرمز؛ التخمين يستهلك الوقت ويضعف الثقة في النتيجة." },
    { key: "independence", label: "الاستقلالية عن التلميحات", score: 100 - summary.hints * 12, weight: 1, skill: "analysis", praise: "حللت الأدلة بنفسك.", tip: "التلميح مقبول، لكن تدرب على علامات الخطر حتى تراها دونه." },
    { key: "recommendation", label: "توصية الاستحواذ", score: rec ? rec.points(summary.solved) : 0, weight: 2, skill: "strategy", praise: "توصية تسعّر المخاطر المكتشفة قبل الإغلاق.", tip: "التحريفات فوق الأهمية النسبية ومخاطر النزاهة تغير السعر والشروط أو القرار نفسه." },
  ];

  const escapeArtist = summary.solved === locks.length && summary.left > 0;
  const verdict = escapeArtist
    ? `فتحت الأقفال الخمسة وبقي ${summary.left} دقيقة.`
    : `فتحت ${summary.solved} من ${locks.length} أقفال.`;
  return { scorecard: buildScorecard({ dimensions, highlights, verdict }), escapeArtist };
}
