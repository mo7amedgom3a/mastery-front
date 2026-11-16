/**
 * The CFO lab's 18-month, driver-based SaaS forecast for «نقطة». Pure and seeded like the other
 * simulators: the same drivers, scenario and funding always produce the same months.
 *
 * Design intent: growth bought with CAC burns cash before it pays back; gross margin is set by
 * hosting and support per customer; price lifts revenue but slows new logos and nudges churn.
 * The downside scenario (two chains leave in month 5, a slower market) is the stress test the
 * investor will ask about.
 */
import { baseline } from "../content/nuqta/company";
import { mulberry32 } from "./ad-market";

export type Drivers = {
  /** Average monthly revenue per account (SAR). */
  price: number;
  /** New accounts per month at today's price. */
  newLogos: number;
  /** Acquisition cost per new account (SAR). */
  cac: number;
  /** Monthly logo churn (%). */
  churn: number;
  /** Cloud cost per account per month (SAR). */
  hosting: number;
  /** Engineers hired over the 18 months. */
  hires: number;
};

export type Funding = "raise" | "debt" | "bridge" | "none";
export type Scenario = "base" | "downside" | "upside";

export const MONTHS = 18;
export const RUNWAY_TARGET = 18;
export const GM_TARGET = 65;
export const SEED = 11;
const SUPPORT_RATIO = 120;
const SUPPORT_COST = 11_000;
const GATEWAY = 0.025;
const HIRE_COST = 26_000;
const REF_PRICE = 690;

export const defaultDrivers: Drivers = { price: 690, newLogos: 14, cac: 6_500, churn: 2.5, hosting: 120, hires: 4 };

export const driverMeta: readonly { id: keyof Drivers; label: string; unit: string; min: number; max: number; step: number; hint: string }[] = [
  { id: "price", label: "متوسط الاشتراك الشهري", unit: "ر.س", min: 490, max: 990, step: 10, hint: "السعر الأعلى يرفع الإيراد لكنه يبطئ العملاء الجدد ويرفع التسرب قليلًا" },
  { id: "newLogos", label: "عملاء جدد شهريًا", unit: "عميل", min: 4, max: 40, step: 1, hint: "أفضل شهر تاريخي 19 عميلًا؛ المتوسط 13" },
  { id: "cac", label: "تكلفة اكتساب العميل CAC", unit: "ر.س", min: 2_000, max: 12_000, step: 250, hint: "الفعلي آخر 6 أشهر 6,500 ر.س" },
  { id: "churn", label: "التسرب الشهري", unit: "٪", min: 0, max: 8, step: 0.1, hint: "الفعلي 2.4–2.8٪ لعملاء المقاهي والتجزئة" },
  { id: "hosting", label: "تكلفة الاستضافة لكل عميل", unit: "ر.س", min: 60, max: 200, step: 5, hint: "120 الآن؛ الحجوزات طويلة الأجل وتحسين قواعد البيانات تنزلها إلى ~85" },
  { id: "hires", label: "مهندسون جدد خلال 18 شهرًا", unit: "مهندس", min: 0, max: 10, step: 1, hint: "خارطة المنتج تحتاج 3–4 لتكامل نقاط البيع" },
];

export const fundingOptions: readonly { id: Funding; label: string; detail: string }[] = [
  { id: "raise", label: "جولة توسعية الآن (6 ملايين ر.س)", detail: "تُغلق في الشهر 4 · تخفيف ملكية ~20٪ · رسوم قانونية 60 ألفًا" },
  { id: "debt", label: "تمويل بالدين (2.5 مليون ر.س)", detail: "يصل الشهر 2 · فائدة 1.1٪ شهريًا · يحتاج هامشًا إجماليًا صحيًا" },
  { id: "bridge", label: "تمويل جسري من الشركاء (1 مليون ر.س)", detail: "يصل الشهر 1 · قابل للتحويل · يشتري وقتًا قصيرًا" },
  { id: "none", label: "لا تمويل: نخفض الحرق ونصل للتعادل", detail: "بلا تخفيف · يتطلب انضباطًا صارمًا في النمو والتوظيف" },
];

export type MonthRow = {
  month: number;
  customers: number;
  newCustomers: number;
  revenue: number;
  cogs: number;
  grossProfit: number;
  grossMargin: number;
  payroll: number;
  marketing: number;
  opex: number;
  interest: number;
  ebitda: number;
  cash: number;
};

export type Forecast = {
  rows: MonthRow[];
  /** Months of cash: when it runs out inside the horizon, or month 18 cash ÷ month 18 burn. */
  runway: number;
  /** Gross margin in month 12 (%). */
  grossMargin: number;
  endingCash: number;
  minCash: number;
  endingCustomers: number;
  /** Months to recover CAC from gross profit. */
  payback: number;
  /** Month 18 EBITDA (SAR). */
  ebitda18: number;
};

const round = (n: number) => Math.round(n);

export function runForecast(drivers: Drivers, scenario: Scenario, funding: Funding, seed = SEED): Forecast {
  const rand = mulberry32(seed * 3_571 + (scenario === "base" ? 1 : scenario === "downside" ? 2 : 3));
  const priceFactor = drivers.price / REF_PRICE;
  const logoElasticity = Math.pow(1 / priceFactor, 0.8);
  const churn = (drivers.churn / 100) * Math.pow(priceFactor, 0.5);
  const basePayroll = baseline.headcount * baseline.avgSalary;

  let customers: number = baseline.customers;
  let cash: number = baseline.cash;
  let debt = 0;
  const rows: MonthRow[] = [];
  let runway: number | null = null;

  for (let month = 1; month <= MONTHS; month++) {
    const noise = 0.9 + rand() * 0.2;
    let growth = 1;
    if (scenario === "upside") growth = 1.2;
    if (scenario === "downside" && month >= 4) growth = 0.7;
    const newCustomers = drivers.newLogos * logoElasticity * growth * noise;
    const monthChurn = scenario === "downside" && month >= 4 ? churn * 1.4 : churn;
    customers = customers * (1 - monthChurn) + newCustomers;
    if (scenario === "downside" && month === 5) customers = Math.max(0, customers - 24);

    const revenue = customers * drivers.price;
    const support = Math.ceil(customers / SUPPORT_RATIO) * SUPPORT_COST;
    const cogs = customers * drivers.hosting + revenue * GATEWAY + support;
    const grossProfit = revenue - cogs;

    const hired = drivers.hires ? Math.min(drivers.hires, Math.max(0, Math.floor(((month - 2) * drivers.hires) / 12) + (month >= 3 ? 1 : 0))) : 0;
    const payroll = basePayroll + hired * HIRE_COST;
    const marketing = drivers.newLogos * growth * drivers.cac * (scenario === "downside" && month >= 4 ? 1 / 0.7 : 1);
    const opex = baseline.officeAndTools + (funding === "raise" && month === 4 ? 60_000 : 0);

    if (funding === "raise" && month === 4) cash += 6_000_000;
    if (funding === "debt" && month === 2) {
      cash += 2_500_000;
      debt = 2_500_000;
    }
    if (funding === "bridge" && month === 1) cash += 1_000_000;
    const interest = debt * 0.011;

    const ebitda = grossProfit - payroll - marketing - opex;
    const before = cash;
    cash += ebitda - interest;
    if (runway === null && cash < 0) runway = month - 1 + before / Math.max(1, before - cash);

    rows.push({
      month,
      customers: round(customers),
      newCustomers: round(newCustomers),
      revenue: round(revenue),
      cogs: round(cogs),
      grossProfit: round(grossProfit),
      grossMargin: revenue ? Math.round((grossProfit / revenue) * 1000) / 10 : 0,
      payroll: round(payroll),
      marketing: round(marketing),
      opex: round(opex),
      interest: round(interest),
      ebitda: round(ebitda),
      cash: round(cash),
    });
  }

  const last = rows[rows.length - 1];
  const burn = -(last.ebitda - last.interest);
  const finalRunway = runway ?? (burn <= 0 ? 48 : Math.min(48, MONTHS + last.cash / burn));
  const m12 = rows[11];
  const gpPerAccount = drivers.price * (m12.grossMargin / 100);
  return {
    rows,
    runway: Math.round(finalRunway * 10) / 10,
    grossMargin: m12.grossMargin,
    endingCash: last.cash,
    minCash: Math.min(...rows.map((r) => r.cash)),
    endingCustomers: last.customers,
    payback: gpPerAccount > 0 ? Math.round((drivers.cac / gpPerAccount) * 10) / 10 : 99,
    ebitda18: last.ebitda,
  };
}

/** Assumptions an investor will challenge, with the reason. */
export function sanityFlags(drivers: Drivers): { id: string; text: string }[] {
  const flags: { id: string; text: string }[] = [];
  if (drivers.churn < 1.5) flags.push({ id: "churn", text: `تسرب ${drivers.churn}٪ شهريًا أقل بكثير من الفعلي (2.4–2.8٪) دون خطة تفسره.` });
  if (drivers.cac < 4_500) flags.push({ id: "cac", text: `CAC ${drivers.cac.toLocaleString("en-US")} ر.س أقل بثلث من الفعلي دون قناة جديدة مثبتة.` });
  if (drivers.newLogos > 24) flags.push({ id: "logos", text: `${drivers.newLogos} عميلًا شهريًا تفوق أفضل شهر تاريخي (19) بفارق كبير.` });
  if (drivers.hosting < 80) flags.push({ id: "hosting", text: `استضافة ${drivers.hosting} ر.س للعميل تحت ما يحققه التحسين الممكن (~85).` });
  if (drivers.price > 900) flags.push({ id: "price", text: `رفع السعر إلى ${drivers.price} ر.س (+${Math.round((drivers.price / REF_PRICE - 1) * 100)}٪) دفعة واحدة يحتاج اختبارًا مع العملاء.` });
  return flags;
}

/** How well a funding choice fits the plan's numbers (0–100). */
export function fundingFit(funding: Funding, base: Forecast, downside: Forecast): { score: number; why: string } {
  const healthy = base.grossMargin >= GM_TARGET;
  switch (funding) {
    case "raise":
      return downside.runway < 18 || base.runway < 24
        ? { score: 95, why: "الجولة تحمي الشركة في السيناريو المتشائم وتمول خارطة المنتج." }
        : { score: 70, why: "الجولة ممكنة، لكن أرقامك تسمح بالانتظار وتقليل التخفيف." };
    case "debt":
      return healthy && downside.runway >= 12
        ? { score: 85, why: "الدين مناسب لأن الهامش صحي والمدرج يتحمل الصدمة." }
        : { score: 35, why: "الدين بهامش ضعيف أو مدرج قصير يضيف فائدة وضغطًا للسداد في أسوأ توقيت." };
    case "bridge":
      return { score: downside.runway >= 15 ? 60 : 30, why: "الجسري يشتري أشهرًا قليلة ولا يغير المسار." };
    case "none":
      return base.runway >= RUNWAY_TARGET && downside.runway >= 15
        ? { score: 90, why: "خطة منضبطة تصل لمدرج كافٍ دون تخفيف." }
        : { score: 15, why: "بلا تمويل، النقد لا يكفي الخطة في السيناريو المتشائم." };
  }
}
