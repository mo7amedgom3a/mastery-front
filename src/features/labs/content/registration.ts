/**
 * Company-registration lab: found «نقطة» in Riyadh with a foreign (Egyptian) partner holding 30%.
 * Choose the legal form, draft the articles, run the government services in a valid order, and
 * clear a returned commercial-register application with the business-center officer.
 *
 * Simplified for training: agencies, prerequisites and indicative fees follow public guides
 * (see `nuqta/sources.ts`), not an official fee schedule.
 */
import type { DocSpec } from "../components/documents/doc-types";
import { chosenOption, redlinableClauses } from "../components/documents/doc-types";
import { tagCount, type DialogueGraph, type DialogueState } from "../model/dialogue";
import { idealOrder, summarize, type PortalService, type PortalState } from "../model/portal-flow";
import { buildScorecard, clock } from "../model/scoring";
import type { Dimension, Highlight, QuizQuestion, Scorecard } from "../model/types";
import { company, money, partners, people } from "./nuqta/company";

// ---------- legal form ----------

export type LegalForm = { id: string; label: string; detail: string; fit: number; why: string };

export const legalForms: readonly LegalForm[] = [
  {
    id: "sjsc",
    label: "شركة مساهمة مبسطة",
    detail: "شكل نظام الشركات 2023 للشركات الناشئة: فئات أسهم، ونقل أسهل للملكية، ويناسب جولات الاستثمار.",
    fit: 100,
    why: "ثلاثة شركاء وجولات استثمار قادمة: المساهمة المبسطة تسمح بفئات أسهم وخيارات موظفين ونقل أسهل.",
  },
  {
    id: "llc",
    label: "شركة ذات مسؤولية محدودة",
    detail: "الأكثر شيوعًا: مسؤولية محدودة بالحصص، وإدارة بمدير أو مجلس مديرين.",
    fit: 85,
    why: "صحيحة ومحدودة المسؤولية، لكن دخول المستثمرين لاحقًا يحتاج تعديل عقد التأسيس لكل جولة.",
  },
  {
    id: "sllc",
    label: "شركة شخص واحد ذات مسؤولية محدودة",
    detail: "مالك واحد بمسؤولية محدودة.",
    fit: 0,
    why: "لدينا ثلاثة شركاء؛ شركة الشخص الواحد لا تناسب الملكية المشتركة.",
  },
  {
    id: "est",
    label: "مؤسسة فردية",
    detail: "سجل باسم شخص سعودي، بلا شخصية اعتبارية مستقلة.",
    fit: 0,
    why: "المؤسسة الفردية لمالك سعودي واحد ومسؤوليته غير محدودة؛ لا يدخلها شريك أجنبي ولا مستثمر.",
  },
  {
    id: "partnership",
    label: "شركة تضامن",
    detail: "شركاء متضامنون في الديون بأموالهم الخاصة.",
    fit: 15,
    why: "المسؤولية غير المحدودة تعرّض أموال الشركاء الشخصية لديون الشركة، ولا تناسب شركة تقنية تجمع استثمارًا.",
  },
];

// ---------- articles of association ----------

export const tradeNames: readonly { id: string; label: string; ok: boolean; why: string }[] = [
  { id: "nuqta-tech", label: "نقطة للحلول التقنية", ok: true, why: "اسم يعكس النشاط ولا يتضمن لفظًا محظورًا." },
  { id: "nuqta-holding", label: "نقطة القابضة", ok: false, why: "لفظ «القابضة» يوحي بنشاط شركة قابضة غير مرخص لنا." },
  { id: "nuqta-bank", label: "بنك نقطة الرقمي", ok: false, why: "«بنك» لفظ منظم لا يُستخدم دون ترخيص من البنك المركزي." },
];

export const managementOptions: readonly { id: string; label: string; ok: boolean; why: string }[] = [
  { id: "board3", label: "مجلس إدارة من 3: فيصل (رئيس تنفيذي)، ريم، وكريم", ok: true, why: "تمثيل الشركاء الثلاثة مع رئيس تنفيذي مسمّى." },
  { id: "karim-only", label: "كريم مديرًا وحيدًا بصلاحيات كاملة", ok: false, why: "الشريك المستثمر خارج المملكة ولا يدير التشغيل اليومي؛ الصلاحيات الكاملة لفرد واحد خطر." },
  { id: "none", label: "لا ينص العقد على الإدارة، نقرر لاحقًا", ok: false, why: "عقد التأسيس يجب أن يحدد طريقة الإدارة ومن يمثل الشركة." },
];

/** The articles as a redlinable document. `acceptance` = readiness for approval, `margin` = protection for the partners. */
export function articlesDoc(input: { form: string; tradeName: string; management: string }): DocSpec {
  const formLabel = legalForms.find((f) => f.id === input.form)?.label ?? "—";
  const name = tradeNames.find((t) => t.id === input.tradeName)?.label ?? "—";
  const management = managementOptions.find((m) => m.id === input.management)?.label ?? "—";
  return {
    title: "عقد تأسيس (مسودة)",
    subtitle: `${formLabel} · ${name}`,
    ref: "NQT-AOA-DRAFT-03",
    date: "2 مارس 2026",
    issuer: { name: company.name, tagline: "تحت التأسيس", color: "green" },
    parties: partners.map((p) => ({ role: p.role, name: p.name, detail: `${p.nationality} · ${p.share}٪` })),
    pages: [
      [
        {
          heading: "البيانات الأساسية",
          blocks: [
            {
              kind: "fields",
              fields: [
                { label: "الاسم التجاري", value: name },
                { label: "الشكل النظامي", value: formLabel },
                { label: "المركز الرئيس", value: `${company.city} · ${company.district}` },
                { label: "النشاط", value: company.activity, wide: true },
                { label: "رأس المال", value: money(company.capital) },
                { label: "الإدارة", value: management, wide: true },
              ],
            },
            {
              kind: "table",
              head: ["الشريك", "الجنسية", "الحصة", "المساهمة النقدية"],
              rows: partners.map((p) => [p.name, p.nationality, `${p.share}%`, money(p.cash)]),
              foot: ["الإجمالي", "", "100%", money(company.capital)],
            },
          ],
        },
        {
          heading: "البنود",
          blocks: [
            {
              kind: "clause",
              id: "contribution",
              number: "م 7",
              title: "حصة الشريك الأجنبي",
              text: "يقدّم الشريك كريم منصور حصته عينًا (أجهزة وبرمجيات) بقيمة يقدّرها بنفسه.",
              issue: "المساهمة العينية تحتاج تقييمًا مستقلًا، وتقدير الشريك لحصته بنفسه يعرّض بقية الشركاء للخطر.",
              options: [
                { id: "keep", label: "إبقاء التقدير الذاتي", text: "", acceptance: -25, margin: -20 },
                {
                  id: "cash",
                  label: "مساهمة نقدية تُودع في حساب الشركة",
                  text: "يدفع كريم منصور حصته نقدًا (150,000 ر.س) في الحساب البنكي للشركة خلال 30 يومًا من القيد.",
                  acceptance: 15,
                  margin: 15,
                  balanced: true,
                },
                {
                  id: "valued",
                  label: "مساهمة عينية بتقييم مقيّم معتمد",
                  text: "تُقدَّم الحصة عينًا بعد تقييمها من مقيّم معتمد، ويضمن الشركاء صحة التقييم.",
                  acceptance: 10,
                  margin: 8,
                  balanced: true,
                },
              ],
            },
            {
              kind: "clause",
              id: "transfer",
              number: "م 11",
              title: "نقل الحصص",
              text: "يجوز لأي شريك بيع حصته لأي طرف دون إشعار الشركاء.",
              issue: "بيع حصة لطرف لا يعرفه الشركاء قد يُدخل منافسًا إلى الشركة.",
              options: [
                { id: "keep", label: "إبقاء النقل الحر", text: "", acceptance: 0, margin: -15 },
                {
                  id: "preempt",
                  label: "حق أولوية للشركاء",
                  text: "للشركاء حق الأولوية في شراء الحصة المعروضة بالسعر نفسه خلال 30 يومًا من الإشعار.",
                  acceptance: 10,
                  margin: 15,
                  balanced: true,
                },
                { id: "ban", label: "منع النقل نهائيًا", text: "لا يجوز نقل الحصص بأي حال.", acceptance: -15, margin: 0, note: "منع النقل مطلقًا يصادم حق الشريك ويعطّل دخول المستثمرين." },
              ],
            },
            {
              kind: "clause",
              id: "powers",
              number: "م 16",
              title: "صلاحيات الرئيس التنفيذي",
              text: "للرئيس التنفيذي صلاحيات مطلقة في الاقتراض والرهن وبيع الأصول.",
              issue: "الصلاحيات المطلقة في الاقتراض والرهن تتجاوز الإدارة اليومية.",
              options: [
                { id: "keep", label: "إبقاء الصلاحيات المطلقة", text: "", acceptance: 0, margin: -20 },
                {
                  id: "limits",
                  label: "صلاحيات يومية وحدود معتمدة",
                  text: "للرئيس التنفيذي الإدارة اليومية في حدود مصفوفة الصلاحيات، ويحتاج الاقتراض والرهن وبيع الأصول إلى قرار المجلس.",
                  acceptance: 10,
                  margin: 18,
                  balanced: true,
                },
              ],
            },
            {
              kind: "clause",
              id: "profits",
              number: "م 21",
              title: "توزيع الأرباح",
              text: "توزع الأرباح شهريًا على الشركاء بالكامل.",
              issue: "شركة ناشئة تحرق نقدًا: توزيع كل ربح فورًا يحرمها من التمويل الذاتي.",
              options: [
                { id: "keep", label: "توزيع شهري كامل", text: "", acceptance: -5, margin: -12 },
                {
                  id: "reserve",
                  label: "قرار سنوي مع احتياطي اختياري",
                  text: "توزع الأرباح بقرار من الشركاء بعد اعتماد القوائم المالية السنوية، ولهم تكوين احتياطي اتفاقي.",
                  acceptance: 10,
                  margin: 10,
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
              parties: partners.map((p) => ({ role: `شريك · ${p.share}٪`, name: p.name, signed: false })),
            },
          ],
        },
      ],
    ],
    footer: "مسودة للمراجعة · لا تُعتمد قبل القيد في المركز السعودي للأعمال",
  };
}

/** 0–100 readiness of the articles: name, management and each clause's best option. */
export function articlesScore(input: { form: string; tradeName: string; management: string }, redlines: Readonly<Record<string, string>>): number {
  const doc = articlesDoc(input);
  let score = 0;
  if (tradeNames.find((t) => t.id === input.tradeName)?.ok) score += 20;
  if (managementOptions.find((m) => m.id === input.management)?.ok) score += 20;
  const clauses = redlinableClauses(doc);
  for (const clause of clauses) {
    const option = chosenOption(clause, redlines);
    if (option?.balanced) score += 60 / clauses.length;
  }
  return Math.round(score);
}

// ---------- government services ----------

export const services: readonly PortalService[] = [
  {
    id: "misa",
    agency: "وزارة الاستثمار",
    label: "ترخيص الاستثمار للشريك الأجنبي",
    after: [],
    days: 10,
    fee: 2_000,
    required: true,
    rejection: "—",
    output: "ترخيص استثمار رقم 1021 · نشاط تقنية المعلومات",
  },
  {
    id: "cr",
    agency: "المركز السعودي للأعمال",
    label: "قيد الشركة وإصدار السجل التجاري",
    after: ["misa"],
    days: 3,
    fee: 1_600,
    required: true,
    rejection: "وجود شريك أجنبي يستلزم ترخيص استثمار ساريًا قبل القيد.",
    output: "السجل التجاري (الرقم الوطني الموحد 7012345678) · تأكيد سنوي للبيانات بدل التجديد",
  },
  {
    id: "ejar",
    agency: "منصة إيجار",
    label: "توثيق عقد إيجار المقر",
    after: ["cr"],
    days: 2,
    fee: 400,
    required: true,
    rejection: "عقد الإيجار التجاري يوثَّق باسم منشأة لها سجل تجاري.",
    output: "عقد إيجار موثق · مكتب 214، حي الملقا",
  },
  {
    id: "address",
    agency: "سبل",
    label: "تسجيل العنوان الوطني للمنشأة",
    after: ["ejar"],
    days: 1,
    fee: 0,
    required: true,
    rejection: "العنوان الوطني يُربط بمقر موثق للمنشأة.",
    output: "العنوان الوطني: RHMA 4527",
  },
  {
    id: "zatca",
    agency: "هيئة الزكاة والضريبة والجمارك",
    label: "التسجيل في الزكاة وضريبة القيمة المضافة",
    after: ["cr"],
    days: 2,
    fee: 0,
    required: true,
    rejection: "التسجيل الضريبي يتطلب سجلًا تجاريًا.",
    output: "الرقم الضريبي 3101234567 · إيرادات السنة الأولى المتوقعة 1.4M تتجاوز حد 375 ألفًا الإلزامي",
  },
  {
    id: "gosi",
    agency: "التأمينات الاجتماعية",
    label: "تسجيل المنشأة في التأمينات",
    after: ["cr"],
    days: 1,
    fee: 0,
    required: true,
    rejection: "تسجيل المنشأة في التأمينات يتطلب سجلًا تجاريًا.",
    output: "رقم اشتراك المنشأة 556677",
  },
  {
    id: "qiwa",
    agency: "منصة قوى",
    label: "ملف المنشأة ونطاقات (التوطين)",
    after: ["cr", "gosi"],
    days: 1,
    fee: 0,
    required: true,
    rejection: "ملف المنشأة في قوى يُبنى على تسجيلها في التأمينات.",
    output: "ملف منشأة · نطاق «أخضر صغير» بعد تسجيل 3 موظفين سعوديين",
  },
  {
    id: "bank",
    agency: "البنك",
    label: "فتح الحساب البنكي وإيداع رأس المال",
    after: ["cr", "address"],
    days: 7,
    fee: 0,
    required: true,
    rejection: "البنك يطلب السجل التجاري والعنوان الوطني لاعتماد حساب الشركة.",
    output: "حساب جاري للشركة · إيداع 500,000 ر.س",
  },
  {
    id: "muqeem",
    agency: "منصة مقيم",
    label: "اشتراك مقيم وتأشيرة وإقامة الشريك الأجنبي",
    after: ["qiwa"],
    days: 5,
    fee: 2_000,
    required: true,
    rejection: "إجراءات الإقامة تتطلب ملف منشأة في قوى.",
    output: "اشتراك مقيم فعّال · طلب إقامة الشريك المستثمر",
  },
  {
    id: "balady",
    agency: "بلدي",
    label: "رخصة البلدية للمقر",
    after: ["cr", "ejar"],
    days: 5,
    fee: 1_500,
    required: true,
    rejection: "رخصة البلدية تحتاج سجلًا وعقد إيجار موثقًا للمقر.",
    output: "رخصة تشغيل مكتب إداري",
  },
  {
    id: "trademark",
    agency: "الهيئة السعودية للملكية الفكرية",
    label: "تسجيل العلامة التجارية «نقطة»",
    after: ["cr"],
    days: 30,
    fee: 7_500,
    required: false,
    rejection: "طلب العلامة يحتاج اسم المنشأة المقيدة.",
    output: "طلب علامة قيد الفحص (اختياري لكنه يحمي الاسم)",
  },
];

/** Shown on the portal home: what each service needs (learners still decide the order). */
export function serviceRequirements(service: PortalService): string {
  if (!service.after.length) return "يُقدَّم أولًا";
  return `يتطلب: ${service.after.map((id) => services.find((s) => s.id === id)?.label ?? id).join("، ")}`;
}

// ---------- returned application (officer dialogue) ----------

export function buildOfficerCall(input: { tradeName: string; contributionOk: boolean }): DialogueGraph {
  const nameOk = tradeNames.find((t) => t.id === input.tradeName)?.ok;
  const reason = !nameOk
    ? `الاسم «${tradeNames.find((t) => t.id === input.tradeName)?.label}» مرفوض: ${tradeNames.find((t) => t.id === input.tradeName)?.why}`
    : !input.contributionOk
      ? "حصة الشريك الأجنبي عينية دون تقييم معتمد، وهذا لا يقبل في عقد التأسيس."
      : "ملاحظة واحدة: تفويض توقيع الشريك الأجنبي على عقد التأسيس غير موثق من سفارة أو موثق معتمد.";
  return {
    id: "officer-call",
    title: "طلب السجل أُعيد بملاحظة",
    start: "open",
    personas: { salem: people.salem, faisal: people.faisal },
    initial: { trust: 50, patience: 60, tension: 40 },
    visibleMeters: ["trust", "patience"],
    turnCost: { patience: -8 },
    breakpoints: [{ when: (s) => s.meters.patience <= 0, to: "closed" }],
    nodes: {
      open: {
        id: "open",
        speaker: "salem",
        line: `السلام عليكم. طلب قيد «نقطة» أُعيد لكم بملاحظة: ${reason}`,
        choices: [
          {
            id: "clarify",
            label: "وعليكم السلام. حتى نصححه مرة واحدة: ما المستند أو الصياغة المطلوبة بالضبط؟ وهل هناك ملاحظات أخرى؟",
            tags: ["clarify"],
            effects: { trust: 10 },
            next: "detail",
            note: { tone: "good", text: "طلب المتطلب الدقيق وكل الملاحظات دفعة واحدة." },
          },
          {
            id: "argue",
            label: "الطلب كان مكتملًا، هذا تعطيل غير مبرر.",
            tags: ["argue"],
            effects: { trust: -15, tension: 15 },
            next: "detail",
            note: { tone: "bad", text: "جادل الموظف بدل فهم الملاحظة." },
          },
          {
            id: "shortcut",
            label: "هل يمكن تمريره هذه المرة؟ نعرف أحدًا في الإدارة.",
            tags: ["shortcut"],
            effects: { trust: -25 },
            next: "refuse",
            note: { tone: "bad", text: "طلب تجاوز الإجراء بالواسطة." },
          },
        ],
      },
      refuse: {
        id: "refuse",
        speaker: "salem",
        line: "لا يوجد تمرير. الطلبات تُعالج بالنظام، والملاحظة يجب أن تُصحح.",
        choices: [
          {
            id: "apologize",
            label: "معك حق، أعتذر. ما المطلوب لتصحيحها؟",
            tags: ["recovery"],
            effects: { trust: 8 },
            next: "detail",
          },
        ],
      },
      detail: {
        id: "detail",
        speaker: "salem",
        line: "عدّلوا البند أو أرفقوا المستند، وأعيدوا الرفع من الطلب نفسه حتى لا تفقدوا الأولوية. الملاحظات الأخرى لا توجد.",
        choices: [
          {
            id: "fix-same-day",
            label: "سنعدّل اليوم ونعيد الرفع من الطلب نفسه، وأرسل لك رقم الطلب للمتابعة. شكرًا لوضوحك.",
            tags: ["action"],
            effects: { trust: 10 },
            next: "faisal",
            note: { tone: "good", text: "التزم بتصحيح فوري من الطلب نفسه." },
          },
          {
            id: "new-application",
            label: "سنقدم طلبًا جديدًا من البداية.",
            tags: ["slow"],
            effects: { trust: -5 },
            next: "faisal",
            note: { tone: "info", text: "طلب جديد يعيد الترتيب في قائمة الانتظار." },
          },
        ],
      },
      faisal: {
        id: "faisal",
        speaker: "faisal",
        line: "وصلتني الرسالة. متى نحصل على السجل؟ المستثمر يسأل.",
        choices: [
          {
            id: "honest-eta",
            label: "الملاحظة واضحة وصححناها اليوم. المتوقع خلال يومي عمل، وأحدّثك فور الاعتماد. التأخير بسببنا لا بسبب المركز.",
            tags: ["ownership"],
            effects: { trust: 8 },
            next: "end",
          },
          {
            id: "blame-gov",
            label: "الإجراءات الحكومية بطيئة، لا نعرف متى.",
            tags: ["blame"],
            effects: { trust: -10 },
            next: "end",
            note: { tone: "bad", text: "حمّل الجهة الحكومية خطأً في مستنداتنا." },
          },
        ],
      },
      end: {
        id: "end",
        speaker: "salem",
        line: "…",
        redirect: [
          { when: (s) => s.meters.trust >= 60, to: "approved" },
          { when: (s) => s.meters.trust >= 35, to: "approved-late" },
          { when: () => true, to: "closed" },
        ],
      },
      approved: { id: "approved", speaker: "salem", line: "وصل التعديل وصدر السجل. بالتوفيق لنقطة.", end: "success" },
      "approved-late": { id: "approved-late", speaker: "salem", line: "صدر السجل بعد إعادة الطلب.", end: "neutral" },
      closed: { id: "closed", speaker: "salem", line: "أُغلق الطلب. يلزمكم تقديم طلب جديد.", end: "fail" },
    },
  };
}

/** Days a returned application costs by how the call went. */
export function officerDelay(outcome: DialogueState["outcome"]): number {
  return outcome === "success" ? 2 : outcome === "neutral" ? 4 : 7;
}

// ---------- registration certificate ----------

export function registrationFile(run: Omit<RegistrationRun, "officer">, state: PortalState, signed: boolean): DocSpec {
  const summary = summarize(services, state);
  const name = tradeNames.find((t) => t.id === run.tradeName)?.label ?? company.legalName;
  return {
    title: "ملف تأسيس المنشأة",
    subtitle: `${name} · ${legalForms.find((f) => f.id === run.form)?.label ?? ""}`,
    ref: "NQT-SETUP-2026",
    date: "مارس 2026",
    issuer: { name: company.name, tagline: "ملف الامتثال الأولي", color: "green" },
    pages: [
      [
        {
          heading: "الخدمات المنجزة",
          blocks: [
            {
              kind: "table",
              head: ["الجهة", "الخدمة", "المخرج"],
              rows: services.filter((s) => state.approved.includes(s.id)).map((s) => [s.agency, s.label, s.output]),
            },
            {
              kind: "fields",
              fields: [
                { label: "أيام حتى التشغيل", value: `${summary.days} يوم عمل` },
                { label: "الرسوم الحكومية التقديرية", value: money(summary.fees) },
                { label: "طلبات مرفوضة", value: String(summary.rejections) },
                {
                  label: "خدمات إلزامية ناقصة",
                  value: summary.missingRequired.length ? summary.missingRequired.map((id) => services.find((s) => s.id === id)?.label).join("، ") : "لا يوجد",
                  wide: true,
                },
              ],
            },
          ],
        },
        {
          heading: "التزامات مستمرة",
          blocks: [
            {
              kind: "checks",
              items: [
                { label: "التأكيد السنوي لبيانات السجل التجاري قبل تاريخه السنوي", checked: true },
                { label: "إقرار ضريبة القيمة المضافة كل ربع (آخر الشهر التالي)", checked: state.approved.includes("zatca") },
                { label: "اشتراكات التأمينات شهريًا لكل موظف", checked: state.approved.includes("gosi") },
                { label: "متابعة نطاقات التوطين في قوى", checked: state.approved.includes("qiwa") },
                { label: "الاستعداد للربط مع «فاتورة» عند إشعار الموجة", checked: state.approved.includes("zatca") },
              ],
            },
            {
              kind: "signatures",
              parties: [
                { role: "مسؤول التأسيس", name: "أنت", signed: true },
                { role: "الرئيس التنفيذي", name: people.faisal.name, signed },
              ],
            },
          ],
        },
      ],
    ],
    footer: "محاكاة تدريبية · الرسوم والمدد تقديرية",
  };
}

// ---------- quizzes ----------

export const registrationPreQuiz: readonly QuizQuestion[] = [
  {
    prompt: "شريك أجنبي يملك 30٪ من شركة ناشئة في الرياض. ما أول خطوة؟",
    options: [
      { label: "ترخيص وزارة الاستثمار قبل قيد السجل", points: 2, style: "analytical" },
      { label: "السجل التجاري ثم الترخيص لاحقًا", points: 0, style: "assertive" },
      { label: "نسجل باسم الشريكين السعوديين ونضيفه لاحقًا", points: 0, style: "avoidant" },
    ],
    explain: "وجود شريك أجنبي يجعل ترخيص الاستثمار شرطًا سابقًا للقيد.",
  },
  {
    prompt: "موظف المركز أعاد طلبك بملاحظة. أفضل رد؟",
    options: [
      { label: "أسأل عن المتطلب الدقيق وكل الملاحظات دفعة واحدة", points: 2, style: "collaborative" },
      { label: "أعترض وأطلب مديره", points: 0, style: "assertive" },
      { label: "أقدم طلبًا جديدًا دون سؤال", points: 1, style: "avoidant" },
    ],
    explain: "سؤال واحد دقيق يوفر جولات رفض متكررة.",
  },
  {
    prompt: "متى يصبح التسجيل في ضريبة القيمة المضافة إلزاميًا؟",
    options: [
      { label: "عند تجاوز التوريدات السنوية 375 ألف ريال", points: 2, style: "analytical" },
      { label: "بعد أول سنة مالية", points: 0, style: "avoidant" },
      { label: "عند تجاوز مليون ريال", points: 0, style: "assertive" },
    ],
    explain: "الحد الإلزامي 375 ألفًا، والاختياري 187.5 ألفًا.",
  },
];

export const registrationPostQuiz: readonly QuizQuestion[] = [
  {
    prompt: "في نظام السجل التجاري الجديد (2025):",
    options: [
      { label: "السجل لا ينتهي، ويُؤكد سنويًا بدل التجديد", points: 2 },
      { label: "يجدد السجل كل خمس سنوات", points: 0 },
      { label: "يلزم سجل منفصل لكل مدينة", points: 0 },
    ],
    explain: "التأكيد السنوي حل محل التجديد، والسجل أصبح وطنيًا موحدًا.",
  },
  {
    prompt: "لماذا تُرفض رخصة البلدية قبل توثيق عقد الإيجار؟",
    options: [
      { label: "لأن الرخصة تُمنح لمقر محدد وموثق باسم المنشأة", points: 2 },
      { label: "لأن البلدية تطلب الرقم الضريبي", points: 0 },
      { label: "لا تُرفض", points: 0 },
    ],
    explain: "الاعتماديات بين الخدمات هي سبب أغلب الرفض المتكرر.",
  },
  {
    prompt: "حصة عينية يقدّرها الشريك بنفسه في عقد التأسيس:",
    options: [
      { label: "تحتاج تقييمًا مستقلًا أو تحويلها لمساهمة نقدية", points: 2 },
      { label: "مقبولة إذا وافق بقية الشركاء شفهيًا", points: 0 },
      { label: "لا مشكلة فيها", points: 0 },
    ],
    explain: "التقييم المستقل يحمي الشركاء والدائنين.",
  },
];

// ---------- run + rubric ----------

export type RegistrationRun = {
  form: string;
  tradeName: string;
  management: string;
  redlines: Record<string, string>;
  portal: PortalState;
  officer: DialogueState;
};

export function scoreRegistration(run: RegistrationRun): { scorecard: Scorecard; founder: boolean } {
  const highlights: Highlight[] = [];
  const form = legalForms.find((f) => f.id === run.form);
  if (form) highlights.push({ at: "الشكل النظامي", tone: form.fit >= 85 ? "good" : "bad", text: form.why });

  const aoa = articlesScore(run, run.redlines);
  const name = tradeNames.find((t) => t.id === run.tradeName);
  if (name && !name.ok) highlights.push({ at: "عقد التأسيس", tone: "bad", text: name.why });
  const mgmt = managementOptions.find((m) => m.id === run.management);
  if (mgmt && !mgmt.ok) highlights.push({ at: "عقد التأسيس", tone: "bad", text: mgmt.why });
  for (const clause of redlinableClauses(articlesDoc(run))) {
    const option = chosenOption(clause, run.redlines);
    if (!option?.balanced) highlights.push({ at: `عقد التأسيس · ${clause.title}`, tone: "bad", text: option?.note ?? clause.issue ?? "" });
  }

  const summary = summarize(services, run.portal);
  for (const entry of run.portal.log.filter((e) => e.status === "rejected")) {
    const service = services.find((s) => s.id === entry.id);
    if (service) highlights.push({ at: "البوابة", tone: "bad", text: `رُفض «${service.label}»: ${service.rejection}` });
  }
  if (summary.missingRequired.length)
    highlights.push({
      at: "الامتثال",
      tone: "bad",
      text: `خدمات إلزامية لم تُنجز: ${summary.missingRequired.map((id) => services.find((s) => s.id === id)?.label).join("، ")}.`,
    });
  const ideal = summarize(services, { approved: idealOrder(services), log: [], delays: { cr: 2 } }).days;
  const order = 100 - summary.rejections * 15;
  const speed = summary.days <= ideal ? 100 : 100 - (summary.days - ideal) * 6;
  const compliance = 100 - summary.missingRequired.length * 25;

  for (const entry of run.officer.transcript) {
    if (entry.note) highlights.push({ at: `مركز الأعمال ${clock(entry.at)}`, tone: entry.note.tone, text: entry.note.text });
  }
  const officer =
    (run.officer.outcome === "success" ? 85 : run.officer.outcome === "neutral" ? 55 : 15) +
    tagCount(run.officer, "clarify", "action", "ownership") * 4 -
    tagCount(run.officer, "argue", "shortcut", "blame") * 12;

  const dimensions: Dimension[] = [
    { key: "form", label: "اختيار الشكل النظامي", score: form?.fit ?? 0, weight: 1.5, skill: "decision", praise: "اخترت شكلًا نظاميًا يناسب الشركاء والاستثمار القادم.", tip: "ابدأ من الملكية: عدد الشركاء، جنسياتهم، وخطة الاستثمار تحدد الشكل." },
    { key: "articles", label: "جودة عقد التأسيس", score: aoa, weight: 2, skill: "execution", praise: "عقد تأسيس واضح يحمي الشركاء ويمر من المراجعة.", tip: "راجع الحصص العينية ونقل الحصص والصلاحيات قبل الرفع: هي أكثر أسباب الإعادة والنزاع." },
    { key: "order", label: "تسلسل الإجراءات", score: order, weight: 2, skill: "analysis", praise: "قدّمت كل خدمة بعد متطلباتها دون رفض.", tip: "ارسم الاعتماديات قبل التقديم: الترخيص ← السجل ← الإيجار ← العنوان والبلدية ← البنك." },
    { key: "speed", label: "الأيام حتى التشغيل", score: speed, weight: 1, skill: "execution", praise: `جاهز للتشغيل خلال ${summary.days} يوم عمل.`, tip: "الخدمات المستقلة بعد السجل تسير بالتوازي؛ الرفض وحده يطيل المسار." },
    { key: "compliance", label: "اكتمال الامتثال", score: compliance, weight: 2, skill: "decision", praise: "أنجزت كل التسجيلات الإلزامية: الضريبة والتأمينات وقوى ومقيم.", tip: "لا تبدأ التشغيل قبل التسجيل الضريبي والتأمينات؛ الغرامات تبدأ من أول فاتورة وأول موظف." },
    { key: "officer", label: "التعامل مع الجهة الحكومية", score: officer, weight: 1.5, skill: "communication", praise: "حللت الملاحظة بسؤال دقيق وتصحيح فوري.", tip: "اسأل عن المتطلب الدقيق، صحح من الطلب نفسه، ولا تطلب تجاوز النظام." },
  ];

  const founder = summary.rejections === 0 && summary.missingRequired.length === 0 && (form?.fit ?? 0) >= 85 && aoa >= 80;
  const verdict = founder
    ? `تأسيس نظيف: ${summary.days} يوم عمل دون رفض، وكل التسجيلات الإلزامية منجزة.`
    : summary.missingRequired.length
      ? `الشركة لم تكتمل نظاميًا: ${summary.missingRequired.length} خدمات إلزامية ناقصة.`
      : `تأسست الشركة خلال ${summary.days} يوم عمل${summary.rejections ? ` مع ${summary.rejections === 1 ? "طلب مرفوض واحد" : `${summary.rejections} طلبات مرفوضة`}` : " دون رفض"}.`;
  return { scorecard: buildScorecard({ dimensions, highlights, verdict }), founder };
}
