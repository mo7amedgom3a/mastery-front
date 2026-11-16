/**
 * Quarter-close lab: «نقطة» closes Q3 2026 (July–September). Close calendar, bank reconciliation
 * with five exceptions, three adjusting entries, the quarterly VAT return, variance analysis
 * against budget, a review with the CFO and the external auditor, then the signed close pack.
 */
import type { DocSpec } from "../components/documents/doc-types";
import {
  calendarIssues,
  checkEntry,
  correctDeductions,
  isMaterial,
  reconcile,
  vatReturn,
  type CloseDay,
  type CloseTask,
  type ExceptionKind,
  type JeTask,
  type JournalEntry,
  type RecLine,
  type VarianceLine,
  type VatLine,
} from "../model/close-engine";
import { tagCount, type DialogueGraph, type DialogueState } from "../model/dialogue";
import { buildScorecard, clock } from "../model/scoring";
import type { Dimension, Highlight, QuizQuestion, Scorecard } from "../model/types";
import { company, money, people } from "./nuqta/company";

// ---------- close calendar ----------

export const closeDays: readonly { id: CloseDay; label: string }[] = [
  { id: -2, label: "قبل الإقفال بيومين" },
  { id: -1, label: "قبل الإقفال بيوم" },
  { id: 1, label: "يوم العمل 1" },
  { id: 2, label: "يوم العمل 2" },
  { id: 3, label: "يوم العمل 3" },
  { id: 4, label: "يوم العمل 4" },
  { id: 5, label: "يوم العمل 5" },
  { id: 20, label: "قبل 31 أكتوبر" },
];

export const closeTasks: readonly CloseTask[] = [
  { id: "cutoff", label: "تعميم القطع (Cut-off) على الأقسام", owner: "لمى · المالية", after: [], latest: -1 },
  { id: "statements", label: "تنزيل كشوف البنك لنهاية سبتمبر", owner: "المحاسب", after: [], latest: 1, earliest: 1 },
  { id: "bankrec", label: "التسوية البنكية", owner: "أنت", after: ["statements"], latest: 2 },
  { id: "payroll", label: "مطابقة الرواتب والتأمينات", owner: "الموارد البشرية + المالية", after: [], latest: 2, earliest: 1 },
  { id: "adjust", label: "قيود الاستحقاق والإيراد المؤجل والمدفوع مقدمًا", owner: "أنت", after: ["cutoff", "bankrec"], latest: 3 },
  { id: "tb", label: "ميزان المراجعة المعدّل", owner: "أنت", after: ["adjust", "payroll"], latest: 3 },
  { id: "variance", label: "تحليل الانحرافات عن الموازنة", owner: "أنت + رؤساء الأقسام", after: ["tb"], latest: 4 },
  { id: "review", label: "مراجعة المديرة المالية والتوقيع", owner: "لمى · المالية", after: ["variance"], latest: 5 },
  { id: "vat", label: "تقديم إقرار ضريبة القيمة المضافة للربع", owner: "أنت", after: ["tb"], latest: 20, earliest: 1 },
];

export const goodCalendar: Record<string, CloseDay> = {
  cutoff: -2,
  statements: 1,
  bankrec: 1,
  payroll: 2,
  adjust: 2,
  tb: 3,
  variance: 4,
  review: 5,
  vat: 20,
};

// ---------- bank reconciliation ----------

export const recBalances = { bank: 1_284_520, book: 1_247_865 } as const;

export const recLines: readonly RecLine[] = [
  { id: "b1", side: "bank", date: "03/09", text: "حوالة واردة · مقهى ديوان", amount: 13_800 },
  { id: "b2", side: "bank", date: "07/09", text: "حوالة واردة · متاجر الوفرة (اشتراك سنوي)", amount: 41_400 },
  { id: "b3", side: "bank", date: "15/09", text: "رسوم خدمات بنكية", amount: -345 },
  { id: "b4", side: "bank", date: "16/09", text: "AMAZON WEB SERVICES EMEA", amount: -18_240 },
  { id: "b5", side: "bank", date: "27/09", text: "رواتب سبتمبر (مدد)", amount: -266_000 },
  { id: "b6", side: "bank", date: "21/09", text: "حوالة واردة · محمصة سُرى", amount: 4_600 },
  { id: "b7", side: "bank", date: "29/09", text: "حوالة واردة · مقهى رُكن", amount: 9_200 },
  { id: "b8", side: "bank", date: "15/09", text: "سداد اشتراكات التأمينات الاجتماعية", amount: -21_350 },
  { id: "l1", side: "book", date: "03/09", text: "تحصيل · مقهى ديوان · INV-0412", amount: 13_800 },
  { id: "l2", side: "book", date: "07/09", text: "تحصيل · متاجر الوفرة · INV-0418", amount: 41_400 },
  { id: "l4", side: "book", date: "16/09", text: "استضافة سحابية · AWS أغسطس", amount: -18_240 },
  { id: "l5", side: "book", date: "27/09", text: "رواتب سبتمبر", amount: -266_000 },
  { id: "l6", side: "book", date: "21/09", text: "تحصيل · محمصة سُرى · INV-0421", amount: 4_600 },
  { id: "l6b", side: "book", date: "22/09", text: "تحصيل · محمصة سُرى · INV-0421", amount: 4_600 },
  { id: "l8", side: "book", date: "15/09", text: "التأمينات الاجتماعية · سبتمبر", amount: -21_350 },
  { id: "l9", side: "book", date: "29/09", text: "شيك 000731 · إيجار المكتب (الربع الرابع)", amount: -60_000 },
  { id: "l10", side: "book", date: "30/09", text: "إيداع شيكات عملاء · فرع العليا", amount: 27_600 },
];

export const recAnswer: { pairs: readonly (readonly [string, string])[]; classes: Record<string, ExceptionKind> } = {
  pairs: [
    ["b1", "l1"],
    ["b2", "l2"],
    ["b4", "l4"],
    ["b5", "l5"],
    ["b6", "l6"],
    ["b8", "l8"],
  ],
  classes: { b3: "fee", b7: "receipt", l6b: "duplicate", l9: "oc", l10: "dit" },
};

// ---------- adjusting entries ----------

export const accounts: readonly { id: string; label: string }[] = [
  { id: "hosting", label: "مصروف الاستضافة السحابية" },
  { id: "accrued", label: "مصروفات مستحقة (التزام)" },
  { id: "revenue", label: "إيرادات الاشتراكات" },
  { id: "deferred", label: "إيرادات مؤجلة (التزام)" },
  { id: "prepaid", label: "مصروفات مدفوعة مقدمًا (أصل)" },
  { id: "insurance", label: "مصروف التأمين" },
  { id: "cash", label: "النقد في البنك" },
  { id: "ar", label: "الذمم المدينة" },
  { id: "suspense", label: "حساب متفرقات (معلّق)" },
];

export const jeTasks: readonly JeTask[] = [
  {
    id: "accrual",
    title: "فاتورة AWS لشهر سبتمبر لم تصل",
    brief: "الاستهلاك الفعلي من لوحة AWS لشهر سبتمبر 18,900 ر.س. الفاتورة تصل في 8 أكتوبر بعد الإقفال.",
    answer: { debit: "hosting", credit: "accrued", amount: 18_900 },
    why: "المصروف يخص سبتمبر: يُثبت بالاستحقاق الآن ولو تأخرت الفاتورة، ثم يُعكس عند وصولها.",
  },
  {
    id: "deferral",
    title: "اشتراك سنوي مدفوع مقدمًا سُجّل كله إيرادًا",
    brief: "«متاجر الوفرة» دفعت 36,000 ر.س (دون الضريبة) في 1 سبتمبر لاشتراك 12 شهرًا، وسُجّل المبلغ كله إيرادًا.",
    answer: { debit: "revenue", credit: "deferred", amount: 33_000 },
    why: "اكتسبنا شهرًا واحدًا (3,000)؛ الباقي 33,000 التزام بخدمة مستقبلية حتى نقدمها.",
  },
  {
    id: "prepaid",
    title: "وثيقة تأمين سنوية صُرفت كلها",
    brief: "دُفعت وثيقة تأمين المكتب 24,000 ر.س في 1 يوليو لمدة 12 شهرًا، وسُجّلت كلها مصروفًا في يوليو.",
    answer: { debit: "prepaid", credit: "insurance", amount: 18_000 },
    why: "استهلكنا 3 أشهر (6,000) في الربع؛ الباقي 18,000 أصل يُستهلك في الأرباع التالية.",
  },
];

// ---------- VAT return ----------

export const vatLines: readonly VatLine[] = [
  { id: "s1", kind: "sale", label: "اشتراكات لعملاء في المملكة", net: 1_180_000, treatment: "standard" },
  { id: "s2", kind: "sale", label: "اشتراكات لعميل في البحرين (تصدير خدمات)", net: 64_000, treatment: "zero" },
  { id: "p1", kind: "purchase", label: "إيجار المكتب التجاري", net: 120_000, treatment: "standard", deductible: true },
  { id: "p2", kind: "purchase", label: "أجهزة حاسب للفريق", net: 85_000, treatment: "standard", deductible: true },
  { id: "p3", kind: "purchase", label: "وكالة تسويق رقمي", net: 105_000, treatment: "standard", deductible: true },
  {
    id: "p4",
    kind: "purchase",
    label: "حفل ضيافة للفريق ومطعم",
    net: 12_000,
    treatment: "standard",
    deductible: false,
    hint: "ضريبة مدخلات الضيافة والترفيه غير قابلة للخصم.",
  },
  {
    id: "p5",
    kind: "purchase",
    label: "مورد طباعة · فاتورة بلا رقم تسجيل ضريبي",
    net: 9_000,
    treatment: "standard",
    deductible: false,
    hint: "لا تُخصم ضريبة المدخلات دون فاتورة ضريبية صحيحة من مورد مسجل.",
  },
  {
    id: "p6",
    kind: "purchase",
    label: "خدمات سحابية من AWS (مورد غير مقيم · احتساب عكسي)",
    net: 54_720,
    treatment: "reverse",
    deductible: true,
    hint: "الاحتساب العكسي: تُصرّح كضريبة مخرجات وتُخصم كمدخلات في الإقرار نفسه.",
  },
];

export const vatDueOptions: readonly { id: string; label: string; correct: boolean }[] = [
  { id: "oct31", label: "31 أكتوبر 2026 (آخر يوم من الشهر التالي للربع)", correct: true },
  { id: "oct15", label: "15 أكتوبر 2026", correct: false },
  { id: "dec31", label: "31 ديسمبر 2026 مع الإقرار السنوي", correct: false },
];

// ---------- variance analysis ----------

export const MATERIALITY = { pct: 0.1, abs: 25_000 } as const;

export const varianceLines: readonly VarianceLine[] = [
  {
    id: "rev",
    label: "إيرادات الاشتراكات",
    budget: 1_260_000,
    actual: 1_118_000,
    reasons: [
      { id: "deferral", label: "تأجيل 33 ألفًا من الاشتراك السنوي + تأخر تشغيل عميلين إلى أكتوبر", correct: true },
      { id: "churn", label: "خسارة عملاء بسبب المنافسة", correct: false },
      { id: "fx", label: "فروقات عملة", correct: false },
    ],
  },
  {
    id: "host",
    label: "الاستضافة السحابية",
    budget: 52_000,
    actual: 79_140,
    reasons: [
      { id: "accrual-region", label: "استحقاق سبتمبر + تشغيل منطقة سحابية ثانية في الرياض", correct: true },
      { id: "price", label: "رفع AWS أسعارها", correct: false },
      { id: "error", label: "خطأ في التسجيل", correct: false },
    ],
  },
  {
    id: "sal",
    label: "الرواتب والتأمينات",
    budget: 790_000,
    actual: 798_400,
    reasons: [
      { id: "hire", label: "تعيين مهندس دعم في سبتمبر", correct: true },
      { id: "bonus", label: "مكافآت غير مخططة", correct: false },
    ],
  },
  {
    id: "mkt",
    label: "التسويق",
    budget: 140_000,
    actual: 105_000,
    reasons: [
      { id: "postpone", label: "تأجيل حملة معرض «هوريكا» إلى الربع الرابع", correct: true },
      { id: "saving", label: "وفر دائم في التكاليف", correct: false },
      { id: "cancel", label: "إلغاء التسويق", correct: false },
    ],
  },
  {
    id: "office",
    label: "المكتب والأدوات",
    budget: 138_000,
    actual: 141_200,
    reasons: [
      { id: "tools", label: "ترقية أدوات التصميم", correct: true },
      { id: "rent", label: "زيادة الإيجار", correct: false },
    ],
  },
];

export const materialIds = varianceLines.filter((line) => isMaterial(line, MATERIALITY)).map((line) => line.id);

// ---------- run ----------

export type CloseRun = {
  plan: Record<string, CloseDay>;
  pairs: (readonly [string, string])[];
  classes: Record<string, ExceptionKind>;
  entries: Record<string, JournalEntry>;
  deducted: string[];
  due: string;
  flags: string[];
  reasons: Record<string, string>;
  review: DialogueState;
};

export type CloseFacts = {
  calendarOk: boolean;
  recDiff: number;
  plugs: number;
  wrongPairs: number;
  entriesRight: number;
  deferralRight: boolean;
  vatRight: boolean;
  blockedClaimed: boolean;
  dueRight: boolean;
  flagsRight: number;
  flagsWrong: number;
};

export function closeFacts(run: Omit<CloseRun, "review">): CloseFacts {
  const rec = reconcile(recLines, recBalances, run.pairs, run.classes);
  const entriesRight = jeTasks.filter((task) => {
    const c = checkEntry(task, run.entries[task.id]);
    return c.accounts && c.amount;
  }).length;
  const deferral = checkEntry(jeTasks[1], run.entries.deferral);
  const right = correctDeductions(vatLines);
  const vatRight = right.length === run.deducted.length && right.every((id) => run.deducted.includes(id));
  const blockedClaimed = run.deducted.some((id) => ["p4", "p5"].includes(id));
  return {
    calendarOk: calendarIssues(closeTasks, run.plan).length === 0,
    recDiff: rec.difference,
    plugs: rec.plugs,
    wrongPairs: rec.wrongPairs,
    entriesRight,
    deferralRight: deferral.accounts && deferral.amount,
    vatRight,
    blockedClaimed,
    dueRight: vatDueOptions.find((o) => o.id === run.due)?.correct ?? false,
    flagsRight: run.flags.filter((id) => materialIds.includes(id)).length,
    flagsWrong: run.flags.filter((id) => !materialIds.includes(id)).length,
  };
}

// ---------- review meeting ----------

export function buildCloseReview(facts: CloseFacts): DialogueGraph {
  const clean = facts.recDiff === 0 && facts.plugs === 0;
  const trust = 40 + (clean ? 12 : 0) + facts.entriesRight * 5 + (facts.vatRight ? 8 : 0);
  return {
    id: "close-review",
    title: "مراجعة حزمة الإقفال",
    start: "open",
    personas: { lama: people.lama, auditor: people.auditor },
    initial: { trust: Math.min(75, trust), patience: 70, tension: 30 },
    visibleMeters: ["trust", "patience"],
    turnCost: { patience: -6 },
    breakpoints: [{ when: (s) => s.meters.patience <= 0, to: "cut-off" }],
    nodes: {
      open: {
        id: "open",
        speaker: "lama",
        line: "حزمة الربع الثالث أمامنا، وأ. ماجد معنا لأن المراجعة النصفية قريبة. ابدأ بالتسوية البنكية: هل تطابقت؟",
        redirect: [{ when: () => !clean, to: "rec-gap" }],
        choices: [
          {
            id: "rec-walk",
            label: "تطابقت بفرق صفر. خمسة بنود: إيداع بالطريق 27,600، شيك إيجار معلّق 60,000، رسوم 345، تحصيل مقهى رُكن 9,200 لم يُسجل، وقيد مكرر لمحمصة سُرى عكسته.",
            tags: ["evidence"],
            effects: { trust: 10 },
            next: "revenue",
            note: { tone: "good", text: "شرح بنود التسوية بالأرقام والتصنيف." },
          },
          {
            id: "rec-short",
            label: "نعم تطابقت، كل شيء تمام.",
            tags: ["vague"],
            effects: { trust: -4 },
            next: "rec-probe",
          },
        ],
      },
      "rec-probe": {
        id: "rec-probe",
        speaker: "auditor",
        line: "«تمام» لا تكفي في ملف المراجعة. ما البنود المعلقة ولماذا؟",
        choices: [
          {
            id: "rec-detail",
            label: "حاضر: إيداع بالطريق وشيك معلّق (توقيت)، ورسوم وتحصيل غير مسجلين وقيد مكرر (قيود في الدفاتر). المستندات مرفقة.",
            tags: ["evidence", "recovery"],
            effects: { trust: 6 },
            next: "revenue",
          },
          {
            id: "rec-dismiss",
            label: "بنود صغيرة لا تستحق الوقت.",
            tags: ["defensive"],
            effects: { trust: -12 },
            next: "revenue",
            note: { tone: "bad", text: "استخف بسؤال المراجع عن بنود التسوية." },
          },
        ],
      },
      "rec-gap": {
        id: "rec-gap",
        speaker: "auditor",
        line:
          facts.plugs > 0
            ? "أرى قيدًا في حساب «متفرقات» لإغلاق فرق التسوية. هذا أول ما سأختبره. ما مصدره؟"
            : `التسوية لم تتطابق: يبقى فرق ${money(Math.abs(facts.recDiff))}. كيف ستوقّع الحزمة بفرق مفتوح؟`,
        choices: [
          {
            id: "gap-own",
            label: "معك حق، الفرق لم يُحلّ بعد. سأعيد مطابقة البنود المعلقة اليوم، وأعكس أي قيد في المتفرقات، ولن نوقّع قبل أن يصبح الفرق صفرًا.",
            tags: ["ownership"],
            effects: { trust: 6 },
            next: "revenue",
            note: { tone: "info", text: "اعترف بفرق التسوية والتزم بإغلاقه قبل التوقيع." },
          },
          {
            id: "gap-hide",
            label: "الفرق غير جوهري، نقفل ونعالجه الربع القادم.",
            tags: ["defensive"],
            effects: { trust: -15 },
            next: "revenue",
            note: { tone: "bad", text: "اقترح ترحيل فرق تسوية غير مفسَّر." },
          },
        ],
      },
      revenue: {
        id: "revenue",
        speaker: "lama",
        line: facts.deferralRight
          ? "الإيراد أقل من الموازنة بـ142 ألفًا. فريق المبيعات منزعج من قيد التأجيل. هل نحتاجه فعلًا؟"
          : "الإيراد يبدو قريبًا من الموازنة. لكن اشتراك «متاجر الوفرة» السنوي، كيف عالجته؟",
        choices: facts.deferralRight
          ? [
              {
                id: "rev-ifrs15",
                label: "نعم. الاشتراك يُكتسب شهرًا بشهر؛ أثبتنا سبتمبر فقط (3,000) والباقي 33,000 إيراد مؤجل. نفسر الانحراف في التقرير بدل تضخيم الإيراد.",
                tags: ["standard", "evidence"],
                effects: { trust: 10 },
                next: "vat",
                note: { tone: "good", text: "دافع عن تأجيل الإيراد بمبدأ الاعتراف عند تقديم الخدمة." },
              },
              {
                id: "rev-cave",
                label: "يمكننا إلغاء القيد إذا كان سيزعج المبيعات.",
                tags: ["pressure"],
                effects: { trust: -14 },
                next: "vat",
                note: { tone: "bad", text: "تراجع عن قيد صحيح تحت ضغط فريق المبيعات." },
              },
            ]
          : [
              {
                id: "rev-fix",
                label: "سجلناه كله إيرادًا، وهذا خطأ. سأؤجل 33,000 للأشهر القادمة وأحدّث الحزمة قبل التوقيع.",
                tags: ["ownership", "standard"],
                effects: { trust: 4 },
                next: "vat",
                note: { tone: "info", text: "اكتشف خطأ الإيراد المؤجل أثناء المراجعة وصححه." },
              },
              {
                id: "rev-defend",
                label: "العميل دفع، فالإيراد إيرادنا.",
                tags: ["defensive"],
                effects: { trust: -12 },
                next: "vat",
                note: { tone: "bad", text: "خلط بين التحصيل النقدي والإيراد المكتسب." },
              },
            ],
      },
      vat: {
        id: "vat",
        speaker: "auditor",
        line: facts.blockedClaimed
          ? "في الإقرار خصمت ضريبة حفل الفريق وفاتورة مورد الطباعة. هل هذا سليم؟"
          : "إقرار الضريبة: كيف عالجت فاتورة AWS؟",
        choices: facts.blockedClaimed
          ? [
              {
                id: "vat-correct",
                label: "لا. الضيافة غير قابلة للخصم، والفاتورة بلا رقم ضريبي. سأعدّل الإقرار قبل تقديمه، وأطلب من المورد فاتورة صحيحة.",
                tags: ["ownership", "compliance"],
                effects: { trust: 5 },
                next: "close",
              },
              {
                id: "vat-risk",
                label: "المبلغ صغير، الهيئة لن تنتبه.",
                tags: ["risk"],
                effects: { trust: -18 },
                next: "close",
                note: { tone: "bad", text: "قبل مخاطرة ضريبية متعمدة." },
              },
            ]
          : [
              {
                id: "vat-reverse",
                label: "احتساب عكسي: صرّحنا 8,208 ضريبة مخرجات وخصمناها مدخلات في الإقرار نفسه، فالأثر النقدي صفر لكنه موثق.",
                tags: ["compliance", "evidence"],
                effects: { trust: 8 },
                next: "close",
                note: { tone: "good", text: "طبّق الاحتساب العكسي على الخدمات المستوردة." },
              },
              {
                id: "vat-skip",
                label: "لم نضعها، فهي شركة أجنبية.",
                tags: ["risk"],
                effects: { trust: -10 },
                next: "close",
              },
            ],
      },
      close: {
        id: "close",
        speaker: "lama",
        line: "…",
        redirect: [
          { when: (s) => s.meters.trust >= 65, to: "signed" },
          { when: (s) => s.meters.trust >= 45, to: "conditional" },
          { when: () => true, to: "rejected" },
        ],
      },
      signed: { id: "signed", speaker: "lama", line: "حزمة نظيفة ومفسَّرة. أوقّعها الآن وأرسلها للمجلس.", end: "success" },
      conditional: {
        id: "conditional",
        speaker: "lama",
        line: "سأوقّع بعد التعديلات التي اتفقنا عليها. أرسلها لي قبل نهاية اليوم.",
        end: "neutral",
      },
      rejected: {
        id: "rejected",
        speaker: "auditor",
        line: "لا أستطيع الاعتماد على هذه الأرقام. أعيدوا الإقفال قبل أن نبدأ المراجعة.",
        end: "fail",
      },
      "cut-off": { id: "cut-off", speaker: "lama", line: "نفد وقتنا. نكمل غدًا، والإقفال تأخر يومًا.", end: "fail" },
    },
  };
}

// ---------- close pack ----------

export function closePack(run: Omit<CloseRun, "review">, signed: boolean): DocSpec {
  const rec = reconcile(recLines, recBalances, run.pairs, run.classes);
  const vat = vatReturn(vatLines, run.deducted);
  return {
    title: "حزمة إقفال الربع الثالث 2026",
    subtitle: `${company.legalName} · يوليو – سبتمبر`,
    ref: "NQT-CLOSE-2026-Q3",
    date: "7 أكتوبر 2026",
    issuer: { name: company.name, tagline: company.tagline, color: "teal" },
    pages: [
      [
        {
          heading: "1. التسوية البنكية · حساب التشغيل",
          blocks: [
            {
              kind: "table",
              head: ["البند", "المبلغ"],
              rows: [
                ["رصيد كشف البنك 30/09", money(recBalances.bank)],
                ["الرصيد المعدّل للبنك", money(rec.adjustedBank)],
                ["رصيد الدفاتر 30/09", money(recBalances.book)],
                ["الرصيد المعدّل للدفاتر", money(rec.adjustedBook)],
              ],
              foot: ["الفرق", money(rec.difference)],
            },
            {
              kind: "callout",
              tone: rec.difference === 0 && rec.plugs === 0 ? "good" : "warn",
              text:
                rec.difference === 0 && rec.plugs === 0
                  ? "التسوية مطابقة دون قيود معلقة."
                  : rec.plugs
                    ? "تحذير: أُغلق الفرق بقيد في حساب المتفرقات دون تفسير."
                    : "تحذير: فرق تسوية مفتوح.",
            },
          ],
        },
        {
          heading: "2. قيود التسوية",
          blocks: [
            {
              kind: "table",
              head: ["القيد", "مدين", "دائن", "المبلغ"],
              rows: jeTasks.map((task) => {
                const entry = run.entries[task.id];
                const name = (id?: string) => accounts.find((a) => a.id === id)?.label ?? "—";
                return [task.title, name(entry?.debit), name(entry?.credit), entry ? money(entry.amount) : "—"];
              }),
            },
          ],
        },
        {
          heading: "3. إقرار ضريبة القيمة المضافة · الربع الثالث",
          blocks: [
            {
              kind: "table",
              head: ["الخانة", "المبلغ"],
              rows: [
                ["المبيعات الخاضعة للنسبة الأساسية", money(vat.salesStandard)],
                ["الصادرات (نسبة صفر)", money(vat.salesZero)],
                ["ضريبة المخرجات (شاملة الاحتساب العكسي)", money(vat.outputVat)],
                ["ضريبة المدخلات القابلة للخصم", money(vat.inputVat)],
              ],
              foot: ["صافي الضريبة المستحقة", money(vat.net)],
            },
            {
              kind: "paragraph",
              muted: true,
              text: `موعد التقديم والسداد: ${vatDueOptions.find((o) => o.id === run.due)?.label ?? "—"}.`,
            },
          ],
        },
      ],
      [
        {
          heading: "4. الانحرافات الجوهرية عن الموازنة",
          blocks: [
            {
              kind: "table",
              head: ["البند", "الموازنة", "الفعلي", "الانحراف", "التفسير"],
              rows: varianceLines.map((line) => [
                line.label,
                money(line.budget, ""),
                money(line.actual, ""),
                `${line.actual >= line.budget ? "+" : "−"}${money(Math.abs(line.actual - line.budget), "")}`,
                run.flags.includes(line.id) ? (line.reasons.find((r) => r.id === run.reasons[line.id])?.label ?? "—") : "غير جوهري",
              ]),
            },
            { kind: "paragraph", muted: true, text: "حد الأهمية: 10٪ من الموازنة و25,000 ر.س معًا." },
          ],
        },
        {
          heading: "5. الاعتماد",
          blocks: [
            {
              kind: "checks",
              items: [
                { label: "التسوية البنكية مطابقة ومرفقة المستندات", checked: rec.difference === 0 && rec.plugs === 0 },
                { label: "قيود الاستحقاق والتأجيل والمدفوع مقدمًا مرحّلة", checked: true },
                { label: "إقرار الضريبة مراجع قبل التقديم", checked: true },
                { label: "الانحرافات الجوهرية مفسَّرة", checked: run.flags.length > 0 },
              ],
            },
            {
              kind: "signatures",
              parties: [
                { role: "مدير الحسابات", name: "أنت", signed: true, date: "7 أكتوبر 2026" },
                { role: "المديرة المالية", name: people.lama.name, signed, date: signed ? "7 أكتوبر 2026" : undefined },
              ],
            },
          ],
        },
      ],
    ],
    footer: `${company.name} · سري · للاستخدام الداخلي ولجنة المراجعة`,
  };
}

// ---------- quizzes ----------

export const closePreQuiz: readonly QuizQuestion[] = [
  {
    prompt: "قبل الإقفال بيوم، التسوية البنكية لا تتطابق بفرق 4,600 ر.س. أول خطوة؟",
    options: [
      { label: "أبحث عن قيد بالمبلغ نفسه: مكرر أو ناقص", points: 2, style: "analytical" },
      { label: "أسجل الفرق في حساب متفرقات وأكمل", points: 0, style: "assertive" },
      { label: "أنتظر كشف الشهر القادم", points: 0, style: "avoidant" },
    ],
    explain: "فرق بمبلغ فاتورة كاملة غالبًا قيد مكرر أو مفقود، وحساب المتفرقات يخفي الخطأ ولا يحله.",
  },
  {
    prompt: "عميل دفع اشتراك سنة مقدمًا. كيف يظهر في الربع؟",
    options: [
      { label: "إيراد للجزء المقدَّم فقط، والباقي التزام مؤجل", points: 2, style: "analytical" },
      { label: "إيراد كامل لأنه دُفع", points: 0, style: "assertive" },
      { label: "لا يُسجل حتى نهاية السنة", points: 0, style: "avoidant" },
    ],
    explain: "الإيراد يُكتسب بتقديم الخدمة، لا بالتحصيل.",
  },
  {
    prompt: "فريق المبيعات يطلب تقديم إيراد عقد يبدأ الشهر القادم لتحقيق هدف الربع.",
    options: [
      { label: "أرفض وأشرح أثره، وأقترح تفسير الانحراف في التقرير", points: 2, style: "collaborative" },
      { label: "أوافق هذه المرة فقط", points: 0, style: "avoidant" },
      { label: "أرفض دون شرح", points: 1, style: "assertive" },
    ],
    explain: "سلامة الأرقام أولًا، مع شرح يحفظ العلاقة.",
  },
];

export const closePostQuiz: readonly QuizQuestion[] = [
  {
    prompt: "الشيك المعلق (صادر ولم يُصرف بعد) في التسوية البنكية:",
    options: [
      { label: "يُطرح من رصيد كشف البنك ولا يحتاج قيدًا", points: 2 },
      { label: "يُعكس في الدفاتر", points: 0 },
      { label: "يُضاف لرصيد الدفاتر", points: 0 },
    ],
    explain: "بنود التوقيت تعدّل جانب البنك؛ أخطاء الدفاتر تُصحح بقيد.",
  },
  {
    prompt: "خدمات سحابية من مورد غير مقيم في الإقرار الضريبي:",
    options: [
      { label: "احتساب عكسي: مخرجات ومدخلات بالمبلغ نفسه", points: 2 },
      { label: "لا تظهر في الإقرار", points: 0 },
      { label: "مدخلات فقط", points: 0 },
    ],
    explain: "المستورد يحتسب الضريبة نيابة عن المورد ثم يخصمها إن كانت قابلة للخصم.",
  },
  {
    prompt: "الانحراف الجوهري عن الموازنة يعني:",
    options: [
      { label: "يتجاوز حدّي النسبة والمبلغ المعتمدين ويحتاج تفسيرًا موثقًا", points: 2 },
      { label: "أي فرق مهما صغر", points: 0 },
      { label: "الفروقات السلبية فقط", points: 0 },
    ],
    explain: "حد الأهمية يركز الوقت على ما يغير قرار القارئ.",
  },
];

// ---------- observer rubric ----------

export function scoreClose(run: CloseRun): { scorecard: Scorecard; cleanClose: boolean } {
  const facts = closeFacts(run);
  const highlights: Highlight[] = [];

  const issues = calendarIssues(closeTasks, run.plan);
  for (const issue of issues.slice(0, 3)) highlights.push({ at: "التقويم", tone: "bad", text: issue });
  const calendar = 100 - issues.length * 18;

  const rec = reconcile(recLines, recBalances, run.pairs, run.classes);
  const classHits = Object.entries(recAnswer.classes).filter(([id, kind]) => run.classes[id] === kind).length;
  const recScore =
    (rec.difference === 0 ? 45 : 10) + classHits * 9 + (6 - Math.min(6, rec.wrongPairs * 2)) * 2 - rec.plugs * 30 - rec.unclassified * 6;
  if (rec.plugs) highlights.push({ at: "التسوية", tone: "bad", text: "أغلقت الفرق بقيد في المتفرقات: هذا يخفي الخطأ ويلفت نظر المراجع." });
  if (rec.difference === 0 && !rec.plugs) highlights.push({ at: "التسوية", tone: "good", text: "تسوية مطابقة بفرق صفر وكل بند مصنف." });
  else if (rec.difference !== 0) highlights.push({ at: "التسوية", tone: "bad", text: `بقي فرق ${money(Math.abs(rec.difference))} دون تفسير.` });

  let jeScore = 0;
  for (const task of jeTasks) {
    const c = checkEntry(task, run.entries[task.id]);
    jeScore += (c.accounts ? 22 : 0) + (c.amount ? 11 : 0);
    if (!c.accounts || !c.amount) highlights.push({ at: "القيود", tone: "bad", text: `${task.title}: ${task.why}` });
  }

  const right = correctDeductions(vatLines);
  const vatHits = vatLines.filter((l) => l.kind === "purchase").filter((l) => right.includes(l.id) === run.deducted.includes(l.id)).length;
  const vatScore = (vatHits / vatLines.filter((l) => l.kind === "purchase").length) * 80 + (facts.dueRight ? 20 : 0);
  if (facts.blockedClaimed) highlights.push({ at: "الضريبة", tone: "bad", text: "خصمت ضريبة غير قابلة للخصم (ضيافة أو فاتورة غير صحيحة)." });
  if (!run.deducted.includes("p6")) highlights.push({ at: "الضريبة", tone: "bad", text: "لم تخصم مدخلات الاحتساب العكسي لـ AWS فدفعت ضريبة زائدة." });

  const reasonHits = run.flags.filter((id) => {
    const line = varianceLines.find((l) => l.id === id);
    return line?.reasons.find((r) => r.id === run.reasons[id])?.correct;
  }).length;
  const variance = (facts.flagsRight / materialIds.length) * 50 + (reasonHits / materialIds.length) * 50 - facts.flagsWrong * 15;
  if (facts.flagsWrong) highlights.push({ at: "الانحرافات", tone: "info", text: "فسّرت بنودًا تحت حد الأهمية: وقت كان يمكن صرفه على الجوهري." });

  for (const entry of run.review.transcript) {
    if (entry.note) highlights.push({ at: `المراجعة ${clock(entry.at)}`, tone: entry.note.tone, text: entry.note.text });
  }
  const review =
    (run.review.outcome === "success" ? 80 : run.review.outcome === "neutral" ? 55 : 20) +
    tagCount(run.review, "evidence", "standard", "compliance") * 5 -
    tagCount(run.review, "defensive", "pressure", "risk") * 10;

  const dimensions: Dimension[] = [
    { key: "calendar", label: "تخطيط الإقفال", score: calendar, weight: 1, skill: "execution", praise: "تقويم إقفال يحترم الاعتماديات والمواعيد.", tip: "رتب المهام بالاعتماديات: الكشوف ← التسوية ← القيود ← الميزان ← التحليل ← التوقيع." },
    { key: "bankrec", label: "التسوية البنكية", score: recScore, weight: 2, skill: "analysis", praise: "طابقت البنك والدفاتر وصنفت كل بند معلق.", tip: "فرّق بين بنود التوقيت (تعدّل البنك) وأخطاء الدفاتر (تحتاج قيدًا)، ولا تستخدم حساب المتفرقات." },
    { key: "entries", label: "قيود الاستحقاق والتأجيل", score: jeScore, weight: 2, skill: "execution", praise: "قيود تسوية صحيحة الحسابات والمبالغ.", tip: "اسأل: هل المصروف أو الإيراد يخص هذه الفترة؟ إن نعم يُثبت الآن، وإن لا يُؤجل." },
    { key: "vat", label: "إقرار الضريبة", score: vatScore, weight: 1.5, skill: "decision", praise: "إقرار سليم: احتساب عكسي صحيح ولا خصم لضريبة محظورة.", tip: "راجع كل فاتورة مدخلات: هل هي فاتورة ضريبية صحيحة؟ هل البند قابل للخصم؟" },
    { key: "variance", label: "تحليل الانحرافات", score: variance, weight: 1.5, skill: "analysis", praise: "ركزت على الانحرافات الجوهرية وفسرتها بأسبابها الحقيقية.", tip: "طبّق حد الأهمية أولًا، ثم ابحث عن السبب التشغيلي لا الوصف الرقمي." },
    { key: "review", label: "الدفاع عن الأرقام", score: review, weight: 1.5, skill: "communication", praise: "شرحت أرقامك بالأدلة وثبتّ على المعايير تحت الضغط.", tip: "أمام المراجع: الدليل والمعيار أولًا، والاعتراف بالخطأ أسرع طريق للثقة." },
  ];

  const cleanClose = rec.difference === 0 && rec.plugs === 0 && facts.vatRight && facts.entriesRight === jeTasks.length;
  const verdict = cleanClose
    ? "إقفال نظيف: تسوية مطابقة، قيود صحيحة، وإقرار ضريبي سليم."
    : rec.difference !== 0 || rec.plugs
      ? "الإقفال لم يكتمل: التسوية البنكية لم تُغلق بشكل سليم."
      : "الإقفال تم مع تصحيحات مطلوبة قبل التوقيع النهائي.";
  return { scorecard: buildScorecard({ dimensions, highlights, verdict }), cleanClose };
}
