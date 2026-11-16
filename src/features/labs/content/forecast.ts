/**
 * Forecast, runway and margins lab: the learner is «نقطة»'s new CFO. Read six months of actuals,
 * diagnose the unit economics, build the 18-month driver model, stress it, choose how to fund it,
 * then defend the assumptions to the lead investor.
 */
import type { DocSpec } from "../components/documents/doc-types";
import { tagCount, type DialogueGraph, type DialogueState } from "../model/dialogue";
import {
  GM_TARGET,
  RUNWAY_TARGET,
  defaultDrivers,
  driverMeta,
  fundingFit,
  fundingOptions,
  runForecast,
  sanityFlags,
  type Drivers,
  type Forecast,
  type Funding,
} from "../model/forecast-sim";
import { buildScorecard, clock } from "../model/scoring";
import type { Dimension, Highlight, QuizQuestion, Scorecard } from "../model/types";
import type { RootCause } from "./deals/types";
import { company, compact, people } from "./nuqta/company";

// ---------- actuals ----------

export const actualsHead = ["الشهر", "العملاء", "الإيراد", "الهامش الإجمالي", "الحرق", "النقد"] as const;

export const actuals: readonly (readonly string[])[] = [
  ["أبريل", "121", "83,490", "58٪", "−298K", "5.12M"],
  ["مايو", "134", "92,460", "59٪", "−305K", "4.82M"],
  ["يونيو", "146", "100,740", "61٪", "−311K", "4.50M"],
  ["يوليو", "157", "108,330", "62٪", "−318K", "4.19M"],
  ["أغسطس", "169", "116,610", "62٪", "−322K", "3.86M"],
  ["سبتمبر", "180", "124,200", "63٪", "−326K", "3.40M"],
];

export const unitNotes: readonly string[] = [
  "الاستضافة 120 ر.س لكل عميل شهريًا: قواعد البيانات تعمل بسعة ثابتة وليست محجوزة.",
  "موظف دعم لكل 120 عميلًا (11 ألفًا شهريًا) لأن التهيئة يدوية لكل فرع.",
  "CAC 6,500 ر.س: 70٪ منها معارض وزيارات ميدانية.",
  "السعر لم يتغير منذ الإطلاق (690 ر.س)، والمنافس الإقليمي يبيع بـ 850.",
];

export const forecastCauses: readonly RootCause[] = [
  { id: "gm", label: "الهامش الإجمالي 63٪ تحت معيار SaaS بسبب الاستضافة والدعم اليدوي", correct: true, why: "" },
  { id: "payback", label: "استرداد CAC يتجاوز 14 شهرًا: النمو يستهلك النقد قبل أن يعيده", correct: true, why: "" },
  { id: "runway", label: "النقد يكفي أقل من 11 شهرًا بالحرق الحالي", correct: true, why: "" },
  { id: "price", label: "السعر أقل من السوق ولم يُختبر منذ الإطلاق", correct: true, why: "" },
  { id: "churn", label: "التسرب المرتفع هو المشكلة الأولى", correct: false, why: "التسرب 2.4–2.8٪ معقول لعملاء المقاهي؛ المشكلة في الهامش والاسترداد." },
  { id: "headcount", label: "الفريق كبير جدًا ويجب تسريح نصفه", correct: false, why: "الرواتب أكبر بند لكن خارطة المنتج تحتاج الفريق؛ القرار ليس في التسريح الشامل." },
  { id: "market", label: "سوق المقاهي صغير ولا يتسع للنمو", correct: false, why: "الأرقام تظهر نموًا ثابتًا 11–13 عميلًا شهريًا؛ لا مؤشر على تشبع." },
];

// ---------- run ----------

export type ForecastRun = { causes: string[]; drivers: Drivers; funding: Funding; qa: DialogueState };

export type ForecastFacts = { base: Forecast; downside: Forecast; upside: Forecast; flags: { id: string; text: string }[]; fit: { score: number; why: string } };

export function forecastFacts(drivers: Drivers, funding: Funding): ForecastFacts {
  const base = runForecast(drivers, "base", funding);
  const downside = runForecast(drivers, "downside", funding);
  const upside = runForecast(drivers, "upside", funding);
  return { base, downside, upside, flags: sanityFlags(drivers), fit: fundingFit(funding, base, downside) };
}

// ---------- investor Q&A ----------

export function buildInvestorQa(drivers: Drivers, funding: Funding): DialogueGraph {
  const facts = forecastFacts(drivers, funding);
  const flag = facts.flags[0];
  const fundingLabel = fundingOptions.find((f) => f.id === funding)?.label ?? "";
  const trust = 40 + (facts.base.runway >= RUNWAY_TARGET ? 10 : 0) + (facts.base.grossMargin >= GM_TARGET ? 8 : 0) - facts.flags.length * 6;
  return {
    id: "investor-qa",
    title: "أسئلة المستثمر الرئيسي",
    start: "open",
    personas: { omar: people.omar, karim: people.karim },
    initial: { trust: Math.max(15, Math.min(70, trust)), patience: 70, tension: 35 },
    visibleMeters: ["trust", "patience"],
    turnCost: { patience: -7 },
    breakpoints: [{ when: (s) => s.meters.patience <= 0, to: "cut-off" }],
    nodes: {
      open: {
        id: "open",
        speaker: "omar",
        line: `قرأت النموذج. مدرجكم ${facts.base.runway} شهرًا في الأساسي و${facts.downside.runway} في المتشائم، والهامش الإجمالي ${facts.base.grossMargin}٪. لكن قبل الأرقام: ما الافتراض الذي لو أخطأتم فيه انهار النموذج؟`,
        choices: [
          {
            id: "sensitivity",
            label: "العملاء الجدد وCAC. لذلك بنيت سيناريو متشائمًا: خروج سلسلتين في الشهر 5 ونمو أبطأ 30٪ وتسرب أعلى، والخطة تصمد فيه.",
            tags: ["sensitivity", "evidence"],
            effects: { trust: 10 },
            next: "assumption",
            note: { tone: "good", text: "سمّى أخطر افتراض وأظهر اختبار الحساسية." },
          },
          {
            id: "confident",
            label: "النموذج محافظ جدًا، لا أتوقع أن ينهار.",
            tags: ["overconfident"],
            effects: { trust: -10 },
            next: "assumption",
            note: { tone: "bad", text: "ادّعى أن النموذج محافظ دون اختبار حساسية." },
          },
        ],
      },
      assumption: {
        id: "assumption",
        speaker: "omar",
        line: flag ? `هذا الرقم لفت نظري: ${flag.text} من أين جاء؟` : `الافتراضات قريبة من الفعلي. كيف وصلتم بالهامش إلى ${facts.base.grossMargin}٪؟`,
        choices: flag
          ? [
              {
                id: "flag-own",
                label: "صحيح، هو طموح وليس مثبتًا. سأعرضه كسيناريو صاعد وأبقي الأساسي على الفعلي التاريخي.",
                tags: ["ownership"],
                effects: { trust: 6 },
                next: "margin",
                note: { tone: "info", text: "اعترف بافتراض متفائل ونقله إلى السيناريو الصاعد." },
              },
              {
                id: "flag-defend",
                label: "فريق المبيعات واثق من تحقيقه.",
                tags: ["hope"],
                effects: { trust: -12 },
                next: "margin",
                note: { tone: "bad", text: "دافع عن افتراض غير مثبت بثقة الفريق بدل الدليل." },
              },
            ]
          : [
              {
                id: "gm-plan",
                label: "حجوزات سحابية لسنة وتحسين قواعد البيانات تنزل الاستضافة إلى ~85 ر.س، ورفع السعر تدريجيًا لعملاء جدد، مع تهيئة ذاتية تقلل الدعم.",
                tags: ["evidence", "unit-economics"],
                effects: { trust: 10 },
                next: "margin",
                note: { tone: "good", text: "ربط الهامش بإجراءات تشغيلية محددة." },
              },
              {
                id: "gm-vague",
                label: "مع النمو تتحسن الهوامش تلقائيًا.",
                tags: ["vague"],
                effects: { trust: -6 },
                next: "margin",
              },
            ],
      },
      margin: {
        id: "margin",
        speaker: "karim",
        line: `بصفتي شريكًا: الهامش ${facts.base.grossMargin}٪ واسترداد CAC ${facts.base.payback} شهرًا. هل ننمو أسرع أم نصلح الاقتصاديات أولًا؟`,
        choices: [
          {
            id: "fix-first",
            label: "نصلح الهامش والاسترداد أولًا ثم نضاعف الإنفاق على النمو؛ كل ريال تسويق اليوم يعود بعد أكثر من سنة.",
            tags: ["unit-economics"],
            effects: { trust: 8 },
            next: "funding",
            note: { tone: "good", text: "قدّم اقتصاديات الوحدة على النمو بأي ثمن." },
          },
          {
            id: "grow-anyway",
            label: "ننمو بأقصى سرعة، الهوامش تُصلح لاحقًا.",
            tags: ["growth-at-all-costs"],
            effects: { trust: -8 },
            next: "funding",
          },
        ],
      },
      funding: {
        id: "funding",
        speaker: "omar",
        line: `اخترتم «${fundingLabel}». لماذا هذا الخيار الآن؟`,
        choices: [
          {
            id: "fund-logic",
            label: `${facts.fit.why} والهدف مدرج 18 شهرًا على الأقل حتى في السيناريو المتشائم.`,
            tags: ["evidence"],
            effects: { trust: facts.fit.score >= 70 ? 10 : 2 },
            next: "close",
            note: { tone: facts.fit.score >= 70 ? "good" : "info", text: "ربط قرار التمويل بالمدرج والسيناريو المتشائم." },
          },
          {
            id: "fund-market",
            label: "السوق مناسب للجمع الآن، والكل يجمع.",
            tags: ["hope"],
            effects: { trust: -6 },
            next: "close",
          },
        ],
      },
      close: {
        id: "close",
        speaker: "omar",
        line: "…",
        redirect: [
          { when: (s) => s.meters.trust >= 65, to: "term-sheet" },
          { when: (s) => s.meters.trust >= 45, to: "follow-up" },
          { when: () => true, to: "pass" },
        ],
      },
      "term-sheet": { id: "term-sheet", speaker: "omar", line: "نموذج نستطيع الاعتماد عليه. أرسلوا غرفة البيانات، وسأعرضه على لجنة الاستثمار الأسبوع القادم.", end: "success" },
      "follow-up": { id: "follow-up", speaker: "omar", line: "مهتم، لكن أريد نسخة ثانية تعالج ملاحظاتي قبل اللجنة.", end: "neutral" },
      pass: { id: "pass", speaker: "omar", line: "الأرقام لا تقنعني بعد. نتحدث بعد ربعين من التنفيذ.", end: "fail" },
      "cut-off": { id: "cut-off", speaker: "omar", line: "عندي اجتماع آخر. أرسلوا ملخصًا مكتوبًا.", end: "fail" },
    },
  };
}

// ---------- forecast memo ----------

export function forecastMemo(run: Omit<ForecastRun, "qa">, signed: boolean): DocSpec {
  const facts = forecastFacts(run.drivers, run.funding);
  const quarterRows = [3, 6, 9, 12, 15, 18].map((m) => facts.base.rows[m - 1]);
  return {
    title: "مذكرة التنبؤ المالي · 18 شهرًا",
    subtitle: `${company.legalName} · أكتوبر 2026 – مارس 2028`,
    ref: "NQT-FCST-2026-10",
    date: "14 أكتوبر 2026",
    issuer: { name: company.name, tagline: company.tagline, color: "sky" },
    pages: [
      [
        {
          heading: "الملخص",
          blocks: [
            {
              kind: "table",
              head: ["المؤشر", "الأساسي", "المتشائم", "المتفائل"],
              rows: [
                ["المدرج (شهر)", String(facts.base.runway), String(facts.downside.runway), String(facts.upside.runway)],
                ["العملاء في الشهر 18", String(facts.base.endingCustomers), String(facts.downside.endingCustomers), String(facts.upside.endingCustomers)],
                ["النقد في الشهر 18", compact(facts.base.endingCash), compact(facts.downside.endingCash), compact(facts.upside.endingCash)],
                ["الهامش الإجمالي (ش12)", `${facts.base.grossMargin}%`, `${facts.downside.grossMargin}%`, `${facts.upside.grossMargin}%`],
              ],
            },
            {
              kind: "callout",
              tone: facts.base.runway >= RUNWAY_TARGET && facts.base.grossMargin >= GM_TARGET ? "good" : "warn",
              text: `التمويل: ${fundingOptions.find((f) => f.id === run.funding)?.label}. ${facts.fit.why}`,
            },
          ],
        },
        {
          heading: "الافتراضات",
          blocks: [
            {
              kind: "table",
              head: ["المحرك", "القيمة", "المرجع"],
              rows: driverMeta.map((d) => [d.label, `${run.drivers[d.id].toLocaleString("en-US")} ${d.unit}`, d.hint]),
            },
            ...(facts.flags.length
              ? [{ kind: "checks" as const, title: "افتراضات تحتاج دليلًا", items: facts.flags.map((f) => ({ label: f.text, checked: false })) }]
              : []),
          ],
        },
      ],
      [
        {
          heading: "السيناريو الأساسي ربعًا بربع",
          blocks: [
            {
              kind: "table",
              head: ["الشهر", "العملاء", "الإيراد", "الهامش", "EBITDA", "النقد"],
              rows: quarterRows.map((r) => [`ش${r.month}`, String(r.customers), compact(r.revenue), `${r.grossMargin}%`, compact(r.ebitda), compact(r.cash)]),
            },
            { kind: "paragraph", muted: true, text: `CAC يُسترد خلال ${facts.base.payback} شهرًا من الربح الإجمالي. المبالغ بالريال السعودي.` },
          ],
        },
        {
          heading: "الاعتماد",
          blocks: [
            {
              kind: "signatures",
              parties: [
                { role: "المدير المالي", name: "أنت", signed: true },
                { role: "الرئيس التنفيذي", name: people.faisal.name, signed },
              ],
            },
          ],
        },
      ],
    ],
    footer: `${company.name} · سري · لأغراض النقاش مع المستثمرين`,
  };
}

// ---------- quizzes ----------

export const forecastPreQuiz: readonly QuizQuestion[] = [
  {
    prompt: "شركة SaaS تحرق 325 ألفًا شهريًا ولديها 3.4 مليون. ما أول ما تحسبه؟",
    options: [
      { label: "المدرج: النقد ÷ الحرق الشهري ≈ 10 أشهر", points: 2, style: "analytical" },
      { label: "الإيراد السنوي المتوقع", points: 0, style: "assertive" },
      { label: "ننتظر نهاية السنة", points: 0, style: "avoidant" },
    ],
    explain: "المدرج يحدد متى يجب أن يبدأ التمويل (عادة 6–9 أشهر قبل النفاد).",
  },
  {
    prompt: "المستثمر يطلب سيناريو متشائمًا. ماذا تضع فيه؟",
    options: [
      { label: "صدمات واقعية: خسارة عملاء كبار ونمو أبطأ وتسرب أعلى", points: 2, style: "analytical" },
      { label: "الأساسي ناقص 5٪", points: 1, style: "avoidant" },
      { label: "لا حاجة، الأساسي محافظ", points: 0, style: "assertive" },
    ],
    explain: "السيناريو المتشائم يختبر الافتراض الأخطر، لا يخصم نسبة عامة.",
  },
  {
    prompt: "الهامش الإجمالي 63٪. أسرع رافعة لتحسينه؟",
    options: [
      { label: "تكلفة الخدمة لكل عميل (استضافة ودعم) ثم السعر", points: 2, style: "analytical" },
      { label: "تسويق أكثر", points: 0, style: "assertive" },
      { label: "تقليل الرواتب الإدارية", points: 0, style: "avoidant" },
    ],
    explain: "الرواتب الإدارية تحت الهامش الإجمالي؛ الهامش يتحرك بتكلفة تقديم الخدمة والسعر.",
  },
];

export const forecastPostQuiz: readonly QuizQuestion[] = [
  {
    prompt: "استرداد CAC = ؟",
    options: [
      { label: "CAC ÷ (الإيراد الشهري للعميل × الهامش الإجمالي)", points: 2 },
      { label: "CAC ÷ الإيراد الشهري للعميل", points: 1 },
      { label: "الإيراد ÷ CAC", points: 0 },
    ],
    explain: "يُسترد CAC من الربح الإجمالي، لا من الإيراد.",
  },
  {
    prompt: "متى يكون التمويل بالدين خيارًا خطرًا؟",
    options: [
      { label: "عندما يكون الهامش ضعيفًا والمدرج قصيرًا في السيناريو المتشائم", points: 2 },
      { label: "دائمًا", points: 0 },
      { label: "عندما تكون الفائدة أقل من 10٪", points: 0 },
    ],
    explain: "الدين يحتاج تدفقًا يغطي الفائدة والسداد حتى في الأوقات الصعبة.",
  },
  {
    prompt: "افتراض تسرب 0.5٪ شهريًا لعملاء المقاهي:",
    options: [
      { label: "غير واقعي دون دليل؛ يضعف مصداقية النموذج كله", points: 2 },
      { label: "طموح جيد", points: 0 },
      { label: "لا يؤثر كثيرًا", points: 0 },
    ],
    explain: "افتراض واحد غير مبرر يجعل المستثمر يشك في بقية النموذج.",
  },
];

// ---------- observer rubric ----------

export function scoreForecast(run: ForecastRun): { scorecard: Scorecard; runwayKeeper: boolean } {
  const facts = forecastFacts(run.drivers, run.funding);
  const highlights: Highlight[] = [];

  const correct = forecastCauses.filter((c) => c.correct);
  const hits = run.causes.filter((id) => correct.some((c) => c.id === id)).length;
  const wrong = run.causes.filter((id) => !correct.some((c) => c.id === id));
  const diagnosis = (hits / 3) * 100 - wrong.length * 25;
  for (const id of wrong) {
    const cause = forecastCauses.find((c) => c.id === id);
    if (cause) highlights.push({ at: "التشخيص", tone: "bad", text: `«${cause.label}»: ${cause.why}` });
  }

  for (const flag of facts.flags) highlights.push({ at: "الافتراضات", tone: "bad", text: flag.text });
  const credibility = 100 - facts.flags.length * 25;

  const runway = Math.min(facts.base.runway / RUNWAY_TARGET, 1) * 60 + Math.min(facts.downside.runway / 15, 1) * 40;
  if (facts.downside.runway < 12) highlights.push({ at: "السيناريو المتشائم", tone: "bad", text: `في المتشائم ينفد النقد بعد ${facts.downside.runway} شهرًا.` });
  else highlights.push({ at: "السيناريو المتشائم", tone: "good", text: `الخطة تصمد في المتشائم: مدرج ${facts.downside.runway} شهرًا.` });

  const margin = ((facts.base.grossMargin - 55) / (GM_TARGET + 5 - 55)) * 100;
  if (facts.base.grossMargin >= GM_TARGET) highlights.push({ at: "الهامش", tone: "good", text: `رفعت الهامش الإجمالي إلى ${facts.base.grossMargin}٪.` });
  if (run.drivers.price === defaultDrivers.price && run.drivers.hosting === defaultDrivers.hosting)
    highlights.push({ at: "الهامش", tone: "info", text: "لم تحرك السعر ولا تكلفة الاستضافة، وهما أقوى رافعتين للهامش." });

  highlights.push({ at: "التمويل", tone: facts.fit.score >= 70 ? "good" : "bad", text: facts.fit.why });

  for (const entry of run.qa.transcript) {
    if (entry.note) highlights.push({ at: `المستثمر ${clock(entry.at)}`, tone: entry.note.tone, text: entry.note.text });
  }
  const qa =
    (run.qa.outcome === "success" ? 80 : run.qa.outcome === "neutral" ? 55 : 20) +
    tagCount(run.qa, "evidence", "sensitivity", "unit-economics") * 5 -
    tagCount(run.qa, "hope", "overconfident", "growth-at-all-costs") * 8;

  const dimensions: Dimension[] = [
    { key: "diagnosis", label: "قراءة الاقتصاديات", score: diagnosis, weight: 1, skill: "analysis", praise: "شخّصت الهامش والاسترداد والمدرج من الأرقام الفعلية.", tip: "ابدأ من اقتصاديات الوحدة: الهامش الإجمالي، استرداد CAC، ثم المدرج." },
    { key: "runway", label: "المدرج والصمود", score: runway, weight: 2, skill: "decision", praise: `مدرج ${facts.base.runway} شهرًا ويصمد في المتشائم.`, tip: "خطط لمدرج 18 شهرًا على الأقل، واختبره بسيناريو متشائم حقيقي." },
    { key: "margin", label: "الهامش الإجمالي", score: margin, weight: 1.5, skill: "analysis", praise: `هامش إجمالي ${facts.base.grossMargin}٪ قريب من معيار SaaS.`, tip: "حرّك تكلفة الخدمة (استضافة ودعم) والسعر قبل أي شيء آخر." },
    { key: "credibility", label: "مصداقية الافتراضات", score: credibility, weight: 2, skill: "execution", praise: "افتراضات مبنية على الفعلي ويمكن الدفاع عنها.", tip: "كل افتراض بعيد عن الفعلي يحتاج دليلًا أو ينتقل إلى السيناريو المتفائل." },
    { key: "funding", label: "قرار التمويل", score: facts.fit.score, weight: 1.5, skill: "strategy", praise: "اخترت تمويلًا يناسب المدرج والهامش.", tip: "اختر التمويل من السيناريو المتشائم: الدين للهامش الصحي، والجولة لحماية المدرج." },
    { key: "qa", label: "الدفاع أمام المستثمر", score: qa, weight: 1.5, skill: "communication", praise: "دافعت عن النموذج بالحساسية والدليل.", tip: "سمِّ أخطر افتراض قبل أن يسأل المستثمر، واعرض كيف اختبرته." },
  ];

  const runwayKeeper = facts.base.runway >= RUNWAY_TARGET && facts.base.grossMargin >= GM_TARGET && facts.flags.length === 0;
  const verdict = runwayKeeper
    ? `خطة بمدرج ${facts.base.runway} شهرًا وهامش ${facts.base.grossMargin}٪ وافتراضات قابلة للدفاع.`
    : facts.flags.length
      ? `المدرج ${facts.base.runway} شهرًا، لكن ${facts.flags.length} افتراضات تحتاج دليلًا.`
      : `المدرج ${facts.base.runway} شهرًا والهامش ${facts.base.grossMargin}٪؛ الهدف 18 شهرًا و${GM_TARGET}٪.`;
  return { scorecard: buildScorecard({ dimensions, highlights, verdict }), runwayKeeper };
}

