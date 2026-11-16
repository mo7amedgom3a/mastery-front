/**
 * Governance lab: after the seed round, «نقطة» needs a real board. The learner is the company
 * secretary: design the board and committees, fill the delegation-of-authority matrix, handle a
 * conflict of interest (the CTO's brother is quoting for hardware), run the first board meeting,
 * then redline the minutes.
 */
import type { DocSpec } from "../components/documents/doc-types";
import { chosenOption, redlinableClauses } from "../components/documents/doc-types";
import { tagCount, type DialogueGraph, type DialogueState } from "../model/dialogue";
import { buildScorecard, clock } from "../model/scoring";
import type { Dimension, Highlight, QuizQuestion, Scorecard } from "../model/types";
import { company, people } from "./nuqta/company";

// ---------- board design ----------

export type BoardDesign = { size: string; independents: string; audit: string; chair: string };

export const boardQuestions: readonly {
  id: keyof BoardDesign;
  label: string;
  options: readonly { id: string; label: string; points: number; why: string }[];
}[] = [
  {
    id: "size",
    label: "عدد أعضاء المجلس",
    options: [
      { id: "3", label: "3 أعضاء: المؤسسان والمستثمر", points: 50, why: "مجلس من الملاك فقط بلا صوت مستقل." },
      { id: "5", label: "5 أعضاء", points: 100, why: "حجم يتسع للمؤسسين والمستثمرين ومستقل دون أن يبطئ القرار." },
      { id: "9", label: "9 أعضاء", points: 30, why: "مجلس كبير لشركة من 14 موظفًا يبطئ القرار ويكلف." },
    ],
  },
  {
    id: "independents",
    label: "الأعضاء المستقلون",
    options: [
      { id: "0", label: "لا يوجد", points: 0, why: "بلا مستقل لا أحد يوازن مصالح الملاك أو يرأس المراجعة." },
      { id: "1", label: "عضو مستقل واحد بخبرة مالية", points: 100, why: "مستقل بخبرة مالية يرأس لجنة المراجعة." },
      { id: "3", label: "ثلاثة مستقلين", points: 60, why: "جيد للشركات المدرجة، لكنه مكلف ومبكر لشركة في جولتها الأولى." },
    ],
  },
  {
    id: "audit",
    label: "لجنة المراجعة",
    options: [
      { id: "independent", label: "لجنة مراجعة يرأسها العضو المستقل", points: 100, why: "الرقابة المالية بيد مستقل عن الإدارة." },
      { id: "ceo", label: "لجنة مراجعة يرأسها الرئيس التنفيذي", points: 10, why: "الإدارة لا تراقب نفسها." },
      { id: "none", label: "لا حاجة للجنة الآن", points: 30, why: "المستثمر يطلب رقابة مالية منظمة قبل الجولة القادمة." },
    ],
  },
  {
    id: "chair",
    label: "رئاسة المجلس",
    options: [
      { id: "separate", label: "رئيس مجلس غير تنفيذي (كريم)", points: 100, why: "فصل الرئاسة عن الإدارة التنفيذية يقوي الرقابة." },
      { id: "ceo", label: "الرئيس التنفيذي يرأس المجلس", points: 50, why: "شائع في الشركات الصغيرة، لكنه يجمع الإدارة والرقابة في يد واحدة." },
    ],
  },
];

export function boardScore(design: BoardDesign): number {
  const scores = boardQuestions.map((q) => q.options.find((o) => o.id === design[q.id])?.points ?? 0);
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

// ---------- delegation of authority ----------

export const approvers: readonly { id: string; label: string }[] = [
  { id: "cfo", label: "المدير المالي" },
  { id: "ceo", label: "الرئيس التنفيذي" },
  { id: "board", label: "مجلس الإدارة" },
  { id: "assembly", label: "الجمعية / الشركاء" },
];

export const doaRows: readonly { id: string; label: string; answer: string; why: string }[] = [
  { id: "payment", label: "سداد فاتورة مورد معتمد حتى 50 ألف ر.س", answer: "cfo", why: "عمليات يومية ضمن موازنة معتمدة." },
  { id: "hiring", label: "توظيف ضمن الهيكل والموازنة المعتمدين", answer: "ceo", why: "إدارة تنفيذية يومية." },
  { id: "budget", label: "اعتماد الموازنة السنوية", answer: "board", why: "الموازنة قرار استراتيجي يعتمده المجلس." },
  { id: "contract", label: "عقد مع عميل أو مورد يتجاوز 500 ألف ر.س", answer: "board", why: "التزام كبير يتجاوز صلاحية الإدارة." },
  { id: "loan", label: "الاقتراض أو رهن أصول الشركة", answer: "board", why: "عقد التأسيس قصر الاقتراض والرهن على المجلس." },
  { id: "rpt", label: "صفقة مع طرف ذي علاقة", answer: "board", why: "يعتمدها المجلس دون تصويت العضو صاحب المصلحة، مع الإفصاح للشركاء." },
  { id: "capital", label: "زيادة رأس المال أو إصدار فئة أسهم جديدة", answer: "assembly", why: "تعديل الملكية من اختصاص الشركاء / الجمعية." },
  { id: "auditor", label: "تعيين المراجع الخارجي وتحديد أتعابه", answer: "assembly", why: "يعيّنه الشركاء / الجمعية لضمان استقلاله عن الإدارة." },
];

// ---------- conflict of interest ----------

export const coiQuotes = [
  ["تقنيات الشهري (يملكها شقيق م. ريم)", "380,000", "تسليم 3 أسابيع · ضمان سنتان"],
  ["الخليج للحلول الذكية", "340,000", "تسليم 5 أسابيع · ضمان سنة"],
  ["رؤية للأجهزة", "365,000", "تسليم 4 أسابيع · ضمان سنتان"],
] as const;

export const coiQuestions: readonly {
  id: string;
  label: string;
  options: readonly { id: string; label: string; points: number; why: string }[];
}[] = [
  {
    id: "disclosure",
    label: "علمت أن «تقنيات الشهري» يملكها شقيق م. ريم. ماذا تفعل أولًا؟",
    options: [
      { id: "written", label: "أطلب من ريم إفصاحًا مكتوبًا عن المصلحة قبل أي نقاش", points: 100, why: "الإفصاح المكتوب أول خطوة في إدارة التعارض." },
      { id: "quiet", label: "أتجاهل الأمر؛ السعر قريب من البقية", points: 0, why: "إخفاء التعارض يعرض القرار والمجلس للمساءلة." },
      { id: "accuse", label: "أبلغ المستثمر أن ريم تحاول تمرير صفقة لأخيها", points: 20, why: "الاتهام قبل الإفصاح يهدم الثقة؛ وجود مصلحة لا يعني سوء نية." },
    ],
  },
  {
    id: "process",
    label: "كيف يُتخذ قرار الشراء؟",
    options: [
      { id: "recuse", label: "يقرر المجلس بمقارنة العروض الثلاثة وريم لا تحضر ولا تصوّت على البند", points: 100, why: "العضو صاحب المصلحة يمتنع، والقرار بمعايير موثقة." },
      { id: "approve", label: "نعتمد عرض الشقيق لأن التسليم أسرع", points: 15, why: "قرار لصالح طرف ذي علاقة دون معالجة التعارض." },
      { id: "ban", label: "نستبعد «تقنيات الشهري» نهائيًا", points: 55, why: "آمن لكنه قد يضيع أفضل عرض؛ المطلوب إدارة التعارض لا منع كل علاقة." },
    ],
  },
  {
    id: "register",
    label: "التوثيق",
    options: [
      { id: "register", label: "أقيده في سجل تعارض المصالح وأُفصح عنه للشركاء في التقرير السنوي", points: 100, why: "التوثيق يحمي الشركة والعضو معًا." },
      { id: "minutes-only", label: "يكفي ذكره شفهيًا في الاجتماع", points: 20, why: "ما لا يُوثق لا يمكن إثباته لاحقًا." },
    ],
  },
];

export function coiScore(answers: Readonly<Record<string, string>>): number {
  const scores = coiQuestions.map((q) => q.options.find((o) => o.id === answers[q.id])?.points ?? 0);
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

// ---------- board meeting ----------

export function buildBoardMeeting(input: { coiHandled: boolean; auditIndependent: boolean }): DialogueGraph {
  return {
    id: "first-board",
    title: "الاجتماع الأول لمجلس الإدارة",
    start: "open",
    personas: { karim: people.karim, omar: people.omar, huda: people.huda, faisal: people.faisal },
    initial: { trust: 50, patience: 70, tension: 35 },
    visibleMeters: ["trust", "tension"],
    turnCost: { patience: -6 },
    breakpoints: [{ when: (s) => s.meters.patience <= 0, to: "adjourned" }],
    nodes: {
      open: {
        id: "open",
        speaker: "karim",
        line: "أهلًا بالجميع. أمين السر، هل نبدأ؟ عندنا الموازنة، وعقد الأجهزة، وخطة التوظيف.",
        choices: [
          {
            id: "quorum",
            label: "قبل البدء: الحضور 5 من 5 والنصاب مكتمل. أطلب من الأعضاء الإفصاح عن أي تعارض في بنود اليوم، ثم نعتمد جدول الأعمال.",
            tags: ["procedure"],
            effects: { trust: 10 },
            next: "budget",
            note: { tone: "good", text: "تحقق من النصاب وطلب الإفصاح عن التعارض قبل البنود." },
          },
          {
            id: "jump",
            label: "نبدأ مباشرة بالموازنة لتوفير الوقت.",
            tags: ["skip"],
            effects: { trust: -6 },
            next: "budget",
            note: { tone: "bad", text: "تجاوز النصاب والإفصاح وجدول الأعمال." },
          },
        ],
      },
      budget: {
        id: "budget",
        speaker: "omar",
        line: "الموازنة 41 صفحة وصلتنا أمس مساءً. أقترح نعتمدها كما هي ونمشي، الكل مشغول.",
        choices: [
          {
            id: "defer-detail",
            label: "المواد يجب أن تصل قبل أسبوع. أقترح اعتماد مبدئي لسقف الربع الأول، ومراجعة لجنة المراجعة للتفاصيل خلال أسبوعين ثم الاعتماد النهائي.",
            tags: ["diligence"],
            effects: { trust: 10, tension: -5 },
            next: "huda-budget",
            note: { tone: "good", text: "رفض اعتماد مستند لم يُقرأ واقترح مسارًا عمليًا." },
          },
          {
            id: "rubber-stamp",
            label: "تمام، نعتمدها بالإجماع.",
            tags: ["rubber-stamp"],
            effects: { trust: -10 },
            next: "huda-budget",
            note: { tone: "bad", text: "اعتماد موازنة لم يقرأها الأعضاء." },
          },
        ],
      },
      "huda-budget": {
        id: "huda-budget",
        speaker: "huda",
        line: "بصفتي رئيسة لجنة المراجعة: أوافق على المسار، وأطلب أن يُسجل في المحضر أن الاعتماد مبدئي.",
        redirect: [{ when: () => !input.auditIndependent, to: "coi" }],
        choices: [
          {
            id: "record",
            label: "سيُسجل حرفيًا مع موعد العرض على اللجنة.",
            tags: ["procedure"],
            effects: { trust: 6 },
            next: "coi",
          },
        ],
      },
      coi: {
        id: "coi",
        speaker: "faisal",
        line: input.coiHandled
          ? "البند الثاني: عقد الأجهزة. ريم أفصحت كتابيًا أن «تقنيات الشهري» لشقيقها."
          : "البند الثاني: عقد الأجهزة. أقترح «تقنيات الشهري»، تسليمهم أسرع، وريم تعرفهم جيدًا.",
        choices: input.coiHandled
          ? [
              {
                id: "recuse",
                label: "شكرًا لريم. أطلب منها مغادرة الاجتماع لهذا البند، ونقارن العروض الثلاثة بمعايير السعر والتسليم والضمان، ويُسجل امتناعها.",
                tags: ["coi", "procedure"],
                effects: { trust: 12, tension: -5 },
                next: "dissent",
                note: { tone: "good", text: "طبّق امتناع العضو صاحب المصلحة وقرارًا بمعايير." },
              },
              {
                id: "stay",
                label: "لا داعي لمغادرتها، كلنا نثق بها.",
                tags: ["coi-weak"],
                effects: { trust: -10, tension: 8 },
                next: "dissent",
                note: { tone: "bad", text: "سمح لصاحب المصلحة بالبقاء في النقاش والتصويت." },
              },
            ]
          : [
              {
                id: "raise-late",
                label: "قبل التصويت: علمت أن الشركة يملكها شقيق ريم. نوقف البند حتى يصل إفصاح مكتوب، ثم نقارن العروض وريم ممتنعة.",
                tags: ["coi", "recovery"],
                effects: { trust: 6, tension: 10 },
                next: "dissent",
                note: { tone: "info", text: "أثار التعارض متأخرًا داخل الاجتماع وأوقف البند." },
              },
              {
                id: "let-pass",
                label: "إذا التسليم أسرع، نعتمد.",
                tags: ["coi-weak"],
                effects: { trust: -15, tension: 10 },
                next: "dissent",
                note: { tone: "bad", text: "مرّت صفقة طرف ذي علاقة دون إفصاح أو امتناع." },
              },
            ],
      },
      dissent: {
        id: "dissent",
        speaker: "huda",
        line: "عندي تحفظ على خطة التوظيف: 4 مهندسين قبل إثبات الهامش مخاطرة. أطلب تسجيل تحفظي.",
        choices: [
          {
            id: "record-dissent",
            label: "يُسجل تحفظ د. هدى بنصه وأسبابه في المحضر، والقرار بالأغلبية مع ربط التوظيف بمؤشر الهامش.",
            tags: ["procedure", "transparency"],
            effects: { trust: 10 },
            next: "off-record",
            note: { tone: "good", text: "سجّل الرأي المخالف بأسبابه." },
          },
          {
            id: "unanimous",
            label: "الأفضل نكتب «بالإجماع» حتى لا نقلق المستثمرين.",
            tags: ["hide"],
            effects: { trust: -14, tension: 10 },
            next: "off-record",
            note: { tone: "bad", text: "اقترح إخفاء تحفظ عضو مستقل." },
          },
        ],
      },
      "off-record": {
        id: "off-record",
        speaker: "faisal",
        line: "آخر شيء، خارج المحضر: عميل كبير اشتكى من تسرب بيانات بسيط الشهر الماضي. ما نبي نكتبه.",
        choices: [
          {
            id: "minute-it",
            label: "ما يُناقش في المجلس يُوثق. نسجله بندًا سريًا مختصرًا مع إجراء: تقرير من ريم للجنة المراجعة خلال أسبوع.",
            tags: ["transparency", "procedure"],
            effects: { trust: 10 },
            next: "close",
            note: { tone: "good", text: "رفض النقاش خارج المحضر ووثقه بإجراء ومسؤول." },
          },
          {
            id: "off",
            label: "تمام، نتكلم فيه بعد الاجتماع.",
            tags: ["hide"],
            effects: { trust: -12 },
            next: "close",
            note: { tone: "bad", text: "قبل نقاشًا جوهريًا خارج المحضر." },
          },
        ],
      },
      close: {
        id: "close",
        speaker: "karim",
        line: "…",
        redirect: [
          { when: (s) => s.meters.trust >= 70, to: "well-run" },
          { when: (s) => s.meters.trust >= 45, to: "ok" },
          { when: () => true, to: "messy" },
        ],
      },
      "well-run": { id: "well-run", speaker: "karim", line: "اجتماع منضبط. أرسل مسودة المحضر خلال 48 ساعة.", end: "success" },
      ok: { id: "ok", speaker: "karim", line: "أنجزنا البنود، لكن نحتاج انضباطًا أكثر في الاجتماع القادم.", end: "neutral" },
      messy: { id: "messy", speaker: "omar", line: "سأرفع للصندوق أن حوكمة الشركة تحتاج إصلاحًا قبل أي تمويل إضافي.", end: "fail" },
      adjourned: { id: "adjourned", speaker: "karim", line: "انتهى الوقت. نؤجل البقية للاجتماع القادم.", end: "fail" },
    },
  };
}

// ---------- minutes ----------

export function minutesDoc(): DocSpec {
  return {
    title: "محضر الاجتماع الأول لمجلس الإدارة",
    subtitle: `${company.legalName} · الاجتماع رقم 1/2026`,
    ref: "NQT-BRD-MIN-2026-01",
    date: "22 أبريل 2026",
    issuer: { name: company.name, tagline: "أمانة سر المجلس", color: "purple" },
    pages: [
      [
        {
          heading: "الحضور",
          blocks: [
            {
              kind: "table",
              head: ["العضو", "الصفة", "الحضور"],
              rows: [
                [people.karim.name, "رئيس المجلس · غير تنفيذي", "حاضر"],
                [people.faisal.name, "عضو تنفيذي · الرئيس التنفيذي", "حاضر"],
                [people.reem.name, "عضو تنفيذي", "حاضرة"],
                [people.omar.name, "عضو · ممثل صندوق رواد", "حاضر"],
                [people.huda.name, "عضوة مستقلة · رئيسة لجنة المراجعة", "حاضرة"],
              ],
            },
            {
              kind: "clause",
              id: "quorum",
              number: "1",
              title: "النصاب",
              text: "عُقد الاجتماع.",
              issue: "المحضر لا يثبت النصاب ولا اعتماد جدول الأعمال؛ قرار بلا نصاب مثبت قابل للطعن.",
              options: [
                { id: "keep", label: "إبقاء الصيغة المختصرة", text: "", acceptance: 0, margin: -10 },
                {
                  id: "full",
                  label: "إثبات النصاب وجدول الأعمال",
                  text: "عُقد الاجتماع حضوريًا بحضور 5 من 5 أعضاء، واكتمل النصاب، واعتُمد جدول الأعمال المرسل في 15 أبريل.",
                  acceptance: 10,
                  margin: 10,
                  balanced: true,
                },
              ],
            },
          ],
        },
        {
          heading: "القرارات",
          blocks: [
            {
              kind: "clause",
              id: "budget",
              number: "2",
              title: "الموازنة",
              text: "اعتمد المجلس موازنة 2026 بالإجماع.",
              issue: "الاعتماد كان مبدئيًا لسقف الربع الأول بانتظار لجنة المراجعة.",
              options: [
                { id: "keep", label: "اعتماد نهائي بالإجماع", text: "", acceptance: 0, margin: -12, note: "المحضر يخالف ما جرى: الاعتماد كان مبدئيًا." },
                {
                  id: "interim",
                  label: "اعتماد مبدئي مع إحالة للجنة",
                  text: "اعتمد المجلس سقف إنفاق الربع الأول مبدئيًا، وأحال الموازنة التفصيلية للجنة المراجعة لعرضها خلال أسبوعين.",
                  acceptance: 10,
                  margin: 12,
                  balanced: true,
                },
              ],
            },
            {
              kind: "clause",
              id: "coi",
              number: "3",
              title: "عقد الأجهزة",
              text: "اعتمد المجلس توريد الأجهزة من «تقنيات الشهري».",
              issue: "المحضر لا يذكر الإفصاح عن المصلحة ولا امتناع العضوة ولا أساس المقارنة.",
              options: [
                { id: "keep", label: "إبقاء الصيغة", text: "", acceptance: -5, margin: -18, note: "صفقة طرف ذي علاقة دون توثيق الإفصاح والامتناع." },
                {
                  id: "disclosed",
                  label: "توثيق الإفصاح والامتناع والمقارنة",
                  text: "أفصحت م. ريم الشهري كتابيًا عن مصلحتها، وغادرت الاجتماع ولم تصوّت. قارن المجلس ثلاثة عروض بمعايير السعر والتسليم والضمان، واعتمد العرض الأفضل وفق المحضر المرفق.",
                  acceptance: 10,
                  margin: 18,
                  balanced: true,
                },
              ],
            },
            {
              kind: "clause",
              id: "dissent",
              number: "4",
              title: "خطة التوظيف",
              text: "وافق المجلس بالإجماع على تعيين 4 مهندسين.",
              issue: "د. هدى طلبت تسجيل تحفظها.",
              options: [
                { id: "keep", label: "«بالإجماع»", text: "", acceptance: -10, margin: -10, note: "إخفاء تحفظ عضو مستقل يفقد المحضر مصداقيته." },
                {
                  id: "recorded",
                  label: "تسجيل التحفظ بأسبابه",
                  text: "وافق المجلس بالأغلبية على تعيين 4 مهندسين مرتبطين بتحقيق هامش إجمالي 65٪، وسجلت د. هدى العمري تحفظها لأن التوظيف يسبق إثبات الهامش.",
                  acceptance: 10,
                  margin: 10,
                  balanced: true,
                },
              ],
            },
            {
              kind: "clause",
              id: "incident",
              number: "5",
              title: "ما يستجد من أعمال",
              text: "لا يوجد.",
              issue: "نوقشت شكوى عميل عن تسرب بيانات.",
              options: [
                { id: "keep", label: "«لا يوجد»", text: "", acceptance: -10, margin: -15, note: "حذف نقاش جوهري عن حادثة بيانات من المحضر." },
                {
                  id: "confidential",
                  label: "بند سري مختصر مع إجراء",
                  text: "ناقش المجلس (بند سري) شكوى عميل بشأن البيانات، وكلف المديرة التقنية بتقرير للجنة المراجعة خلال 7 أيام.",
                  acceptance: 10,
                  margin: 15,
                  balanced: true,
                },
              ],
            },
          ],
        },
        {
          blocks: [
            {
              kind: "signatures",
              parties: [
                { role: "رئيس المجلس", name: people.karim.name, signed: false },
                { role: "أمين السر", name: "أنت", signed: false },
              ],
            },
          ],
        },
      ],
    ],
    footer: `${company.name} · سري · محضر مجلس الإدارة`,
  };
}

export function minutesScore(redlines: Readonly<Record<string, string>>): number {
  const clauses = redlinableClauses(minutesDoc());
  const good = clauses.filter((c) => chosenOption(c, redlines)?.balanced).length;
  return Math.round((good / clauses.length) * 100);
}

// ---------- quizzes ----------

export const governancePreQuiz: readonly QuizQuestion[] = [
  {
    prompt: "عضو مجلس له مصلحة في صفقة مطروحة. ما الإجراء السليم؟",
    options: [
      { label: "إفصاح مكتوب، ثم يمتنع عن النقاش والتصويت", points: 2, style: "analytical" },
      { label: "يصوت بشرط أن يكون السعر جيدًا", points: 0, style: "assertive" },
      { label: "نتجنب الموضوع حتى لا نحرجه", points: 0, style: "avoidant" },
    ],
    explain: "الإفصاح والامتناع يحميان القرار والعضو.",
  },
  {
    prompt: "عضو مستقل يعترض على قرار. في المحضر:",
    options: [
      { label: "يُسجل اعتراضه وأسبابه", points: 2, style: "collaborative" },
      { label: "نكتب «بالإجماع» حفاظًا على الصورة", points: 0, style: "avoidant" },
      { label: "نؤجل القرار حتى يوافق", points: 1, style: "avoidant" },
    ],
    explain: "المحضر سجل ما حدث، لا ما نتمنى أن يكون حدث.",
  },
  {
    prompt: "مستثمر يطلب اعتماد موازنة وصلت ليلة الاجتماع.",
    options: [
      { label: "اعتماد مبدئي محدود ومراجعة التفاصيل في اللجنة", points: 2, style: "collaborative" },
      { label: "نعتمدها؛ الوقت ضيق", points: 0, style: "assertive" },
      { label: "نرفض مناقشتها", points: 1, style: "avoidant" },
    ],
    explain: "العناية الواجبة تعني ألا يعتمد المجلس ما لم يقرأه.",
  },
];

export const governancePostQuiz: readonly QuizQuestion[] = [
  {
    prompt: "من يعيّن المراجع الخارجي عادة؟",
    options: [
      { label: "الشركاء / الجمعية العامة", points: 2 },
      { label: "الرئيس التنفيذي", points: 0 },
      { label: "المدير المالي", points: 0 },
    ],
    explain: "تعيينه من الملاك يضمن استقلاله عن الإدارة التي يراجعها.",
  },
  {
    prompt: "لماذا يرأس لجنة المراجعة عضو مستقل؟",
    options: [
      { label: "لأن الإدارة لا تراقب نفسها", points: 2 },
      { label: "لأنه الأقل انشغالًا", points: 0 },
      { label: "لأن النظام يمنع التنفيذيين من حضور الاجتماعات", points: 0 },
    ],
    explain: "الاستقلال شرط فعالية الرقابة.",
  },
  {
    prompt: "مصفوفة الصلاحيات تفيد في:",
    options: [
      { label: "تحديد من يعتمد كل نوع قرار وحدوده، فتسرع القرارات اليومية وتحمي الكبيرة", points: 2 },
      { label: "تقليل عدد الاجتماعات فقط", points: 0 },
      { label: "منح الرئيس التنفيذي كل الصلاحيات", points: 0 },
    ],
    explain: "الوضوح يمنع الاختناق والتجاوز معًا.",
  },
];

// ---------- run + rubric ----------

export type GovernanceRun = {
  design: BoardDesign;
  doa: Record<string, string>;
  coi: Record<string, string>;
  meeting: DialogueState;
  minutes: Record<string, string>;
};

export function scoreGovernance(run: GovernanceRun): { scorecard: Scorecard; governanceGuardian: boolean } {
  const highlights: Highlight[] = [];
  for (const q of boardQuestions) {
    const option = q.options.find((o) => o.id === run.design[q.id]);
    if (option && option.points < 80) highlights.push({ at: `المجلس · ${q.label}`, tone: "bad", text: option.why });
  }
  const structure = boardScore(run.design);

  const doaHits = doaRows.filter((row) => run.doa[row.id] === row.answer).length;
  for (const row of doaRows.filter((r) => run.doa[r.id] !== r.answer).slice(0, 3)) {
    highlights.push({ at: "مصفوفة الصلاحيات", tone: "bad", text: `${row.label}: ${row.why}` });
  }
  const doa = (doaHits / doaRows.length) * 100;

  const coi = coiScore(run.coi);
  for (const q of coiQuestions) {
    const option = q.options.find((o) => o.id === run.coi[q.id]);
    if (option) highlights.push({ at: "تعارض المصالح", tone: option.points >= 80 ? "good" : "bad", text: option.why });
  }

  for (const entry of run.meeting.transcript) {
    if (entry.note) highlights.push({ at: `الاجتماع ${clock(entry.at)}`, tone: entry.note.tone, text: entry.note.text });
  }
  const meeting =
    (run.meeting.outcome === "success" ? 80 : run.meeting.outcome === "neutral" ? 55 : 20) +
    tagCount(run.meeting, "procedure", "coi", "transparency", "diligence") * 3 -
    tagCount(run.meeting, "hide", "coi-weak", "rubber-stamp", "skip") * 8;

  const minutes = minutesScore(run.minutes);
  for (const clause of redlinableClauses(minutesDoc())) {
    const option = chosenOption(clause, run.minutes);
    if (!option?.balanced && option?.note) highlights.push({ at: `المحضر · ${clause.title}`, tone: "bad", text: option.note });
  }

  const dimensions: Dimension[] = [
    { key: "structure", label: "تشكيل المجلس واللجان", score: structure, weight: 1.5, skill: "strategy", praise: "مجلس متوازن بعضو مستقل يرأس المراجعة.", tip: "حجم مناسب، صوت مستقل، ولجنة مراجعة لا يرأسها التنفيذيون." },
    { key: "doa", label: "مصفوفة الصلاحيات", score: doa, weight: 1.5, skill: "execution", praise: "صلاحيات واضحة: اليومي للإدارة والجوهري للمجلس والملكية للشركاء.", tip: "اسأل: هل القرار يومي ضمن موازنة؟ استراتيجي؟ أم يمس الملكية؟" },
    { key: "coi", label: "إدارة تعارض المصالح", score: coi, weight: 2, skill: "decision", praise: "إفصاح مكتوب، امتناع، وقرار بمعايير موثقة.", tip: "الإفصاح ← الامتناع ← المقارنة بمعايير ← التوثيق في السجل." },
    { key: "meeting", label: "إدارة الاجتماع", score: meeting, weight: 2, skill: "communication", praise: "اجتماع منضبط: نصاب، إفصاح، ورأي مخالف مسجل.", tip: "النصاب والإفصاح أولًا، ولا نقاش خارج المحضر، ولا اعتماد لما لم يُقرأ." },
    { key: "minutes", label: "دقة المحضر", score: minutes, weight: 1.5, skill: "execution", praise: "محضر يطابق ما جرى ويحمي القرارات.", tip: "المحضر يسجل النصاب والإفصاحات والتحفظات والإجراءات بمسؤول وموعد." },
  ];

  const governanceGuardian = coi >= 90 && minutes >= 80 && run.meeting.outcome === "success";
  const verdict = governanceGuardian
    ? "حوكمة سليمة: تعارض مُدار، اجتماع منضبط، ومحضر دقيق."
    : coi < 60
      ? "تعارض المصالح لم يُدَر بشكل سليم، وهذا أول ما سيسأل عنه المستثمر."
      : "أساس حوكمة جيد يحتاج انضباطًا أكثر في الاجتماع والمحضر.";
  return { scorecard: buildScorecard({ dimensions, highlights, verdict }), governanceGuardian };
}
