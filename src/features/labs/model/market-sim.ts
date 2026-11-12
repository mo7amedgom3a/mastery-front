/**
 * The CEO lab's quarterly market simulator: «سلة الحي» (grocery delivery) against a well-funded
 * new rival «فوري». Pure and seeded, like the ad market: the same plan always plays out the same.
 *
 * Design intent: an all-in price war wins share that evaporates (the rival matches, promo share
 * decays) while it burns cash on every order; delivery speed and loyalty recover share slowly but
 * keep it, because they also blunt the rival's pull.
 */
import { mulberry32 } from "./ad-market";

export type Lever = "price" | "marketing" | "delivery" | "loyalty" | "b2b" | "cost";
export type Allocation = Record<Lever, number>;

export const levers: readonly { id: Lever; label: string; hint: string }[] = [
  { id: "price", label: "خفض الأسعار والخصومات", hint: "يرفع الحصة فورًا لكنه يخفض إيراد كل الطلبات، والمنافس يطابقه" },
  { id: "marketing", label: "التسويق والاستحواذ", hint: "يجلب عملاء جددًا، أثره يتلاشى إن لم يبقوا" },
  { id: "delivery", label: "سرعة التوصيل والمنتج", hint: "يقلّص زمن التوصيل ويحمي الحصة على المدى الطويل" },
  { id: "loyalty", label: "الولاء والاحتفاظ", hint: "يخفض تسرب العملاء الحاليين ويرفع رضاهم" },
  { id: "b2b", label: "قطاع الشركات (B2B)", hint: "إيراد جديد من المكاتب والمطاعم بعيدًا عن حرب الأسعار" },
  { id: "cost", label: "خفض التكاليف", hint: "يوفّر النقد لكنه يضعف المعنويات والخدمة" },
];

export const QUARTERS = 4;
/** Discretionary budget per quarter, million SAR. */
export const QUARTER_BUDGET = 12;
export const START_SHARE = 27;
export const PRE_RIVAL_SHARE = 34;
export const TARGET_SHARE = 32;
export const RUNWAY_TARGET = 12;
/** Net revenue pool of the market per quarter, million SAR. */
const MARKET = 130;
const RIVAL_PULL = [2.6, 2.0, 1.4, 0] as const;

export type QuarterEvent = {
  quarter: number;
  title: string;
  text: string;
  choices: readonly { id: string; label: string; detail: string }[];
};

export const quarterEvents: readonly QuarterEvent[] = [
  {
    quarter: 1,
    title: "فوري تعلن حرب أسعار",
    text: "فوري أطلقت خصم 30٪ إضافيًا على أول خمسة طلبات لكل عميل، وإعلاناتها في كل مكان.",
    choices: [
      { id: "match", label: "نطابق الخصم فورًا", detail: "تكلفة 5 ملايين، حصة سريعة" },
      { id: "guarantee", label: "نطلق «توصيل خلال 30 دقيقة أو مجانًا»", detail: "تكلفة 1.5 مليون، يرفع الرضا" },
      { id: "ignore", label: "لا نرد", detail: "بلا تكلفة، نخسر بعض العملاء" },
    ],
  },
  {
    quarter: 2,
    title: "فوري تستقطب مدير العمليات",
    text: "عرضت فوري على مدير العمليات راتبًا أعلى بـ60٪. هو العقل وراء تحسين زمن التوصيل.",
    choices: [
      { id: "counter", label: "عرض مقابل للاحتفاظ به", detail: "تكلفة 0.8 مليون" },
      { id: "promote", label: "ترقية نائبته من الداخل", detail: "يرفع المعنويات، تباطؤ مؤقت" },
      { id: "let-go", label: "نتركه ونعيّن من الخارج", detail: "اضطراب في العمليات" },
    ],
  },
  {
    quarter: 3,
    title: "المجلس يطالب بتسريح 15٪",
    text: "عضوان في المجلس يطالبان بتسريح 15٪ من الموظفين لإطالة عمر النقد.",
    choices: [
      { id: "comply", label: "تسريح 15٪ كما طُلب", detail: "توفير كبير، ضربة للمعنويات والخدمة" },
      { id: "targeted", label: "تخفيض موجّه للوظائف المكررة فقط", detail: "توفير متوسط" },
      { id: "refuse", label: "نرفض التسريح", detail: "المعنويات تتحسن، والمجلس قلق" },
    ],
  },
  {
    quarter: 4,
    title: "جولة تمويل فوري تفشل",
    text: "فوري لم تغلق جولتها التمويلية وأوقفت الخصومات. عملاؤها يبحثون عن بديل.",
    choices: [
      { id: "winback", label: "حملة استعادة عملاء موجّهة", detail: "تكلفة 2 مليون، تنجح إن كان رضا عملائنا جيدًا" },
      { id: "acquire", label: "نستحوذ على فوري", detail: "تكلفة 25 مليونًا" },
      { id: "hold", label: "نكمل خطتنا كما هي", detail: "بلا تكلفة" },
    ],
  },
];

export type QuarterResult = {
  quarter: number;
  allocation: Allocation;
  eventChoice: string;
  share: number;
  revenue: number;
  profit: number;
  cash: number;
  runway: number;
  nps: number;
  morale: number;
  churn: number;
  deliveryMinutes: number;
};

export type MarketState = {
  quarter: number;
  structural: number;
  promo: number;
  share: number;
  cash: number;
  runway: number;
  nps: number;
  morale: number;
  churn: number;
  deliveryMinutes: number;
  loyalty: number;
  b2bRevenue: number;
  fixedSavings: number;
  boardDelta: number;
  history: QuarterResult[];
};

export function startMarket(): MarketState {
  return {
    quarter: 0,
    structural: START_SHARE,
    promo: 0,
    share: START_SHARE,
    cash: 75,
    runway: 30,
    nps: 31,
    morale: 64,
    churn: 6.5,
    deliveryMinutes: 68,
    loyalty: 0,
    b2bRevenue: 0,
    fixedSavings: 0,
    boardDelta: 0,
    history: [],
  };
}

export const emptyAllocation: Allocation = { price: 0, marketing: 0, delivery: 0, loyalty: 0, b2b: 0, cost: 0 };

export function allocationTotal(allocation: Allocation): number {
  return Object.values(allocation).reduce((sum, v) => sum + v, 0);
}

const round1 = (n: number) => Math.round(n * 10) / 10;
const bound = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

export function simulateQuarter(state: MarketState, allocation: Allocation, eventChoice: string, seed: number): MarketState {
  const q = state.quarter + 1;
  if (q > QUARTERS) return state;
  const rand = mulberry32(seed * 7919 + q * 104_729);
  const total = allocationTotal(allocation) || 1;
  const a = Object.fromEntries(Object.entries(allocation).map(([k, v]) => [k, v / total])) as Allocation;

  let { structural, promo, cash, nps, morale, churn, deliveryMinutes, loyalty, b2bRevenue, fixedSavings, boardDelta } = state;
  let eventCash = 0;

  // Event choice.
  switch (eventChoice) {
    case "match":
      eventCash -= 5;
      promo += 1.2;
      break;
    case "guarantee":
      eventCash -= 1.5;
      nps += 5;
      structural += 0.6;
      break;
    case "ignore":
      structural -= 0.8;
      break;
    case "counter":
      eventCash -= 0.8;
      morale += 3;
      break;
    case "promote":
      morale += 8;
      deliveryMinutes += 3;
      break;
    case "let-go":
      morale -= 6;
      deliveryMinutes += 10;
      break;
    case "comply":
      fixedSavings += 3;
      morale -= 22;
      nps -= 6;
      deliveryMinutes += 6;
      boardDelta += 10;
      break;
    case "targeted":
      fixedSavings += 1.5;
      morale -= 5;
      boardDelta += 5;
      break;
    case "refuse":
      morale += 3;
      boardDelta -= 12;
      break;
    case "winback":
      eventCash -= 2;
      structural += nps >= 40 ? 2.6 : 0.9;
      break;
    case "acquire":
      eventCash -= 25;
      structural += 4;
      morale -= 8;
      break;
    case "hold":
      structural += 0.8;
      break;
  }

  // Levers.
  const before = deliveryMinutes;
  deliveryMinutes = bound(deliveryMinutes - a.delivery * 40, 22, 90);
  loyalty += a.loyalty;
  churn = bound(churn - a.loyalty * 2.5 + a.cost * 1.2, 2.5, 12);
  b2bRevenue += a.b2b * 5;
  const defense = bound((68 - deliveryMinutes) / 50 + loyalty * 0.4, 0, 0.85);
  const rivalMatches = q <= 3;

  structural += -RIVAL_PULL[q - 1] * (1 - defense) + (before - deliveryMinutes) * 0.07 + a.loyalty * 1.8 + a.marketing * 0.6 - a.cost * 1.2;
  promo = promo * 0.3 + a.price * 7 * (rivalMatches ? 0.5 : 1) + a.marketing * 2;
  const share = round1(bound(structural + promo + (rand() - 0.5) * 0.4, 5, 60));

  const coreRevenue = MARKET * (share / 100) * (1 - a.price * 0.18);
  const revenue = coreRevenue + b2bRevenue;
  // Discounts are subsidised per order on top of the budget: the bigger the share, the bigger the bill.
  const subsidy = a.price * share * 0.12;
  const opsCost = coreRevenue * 0.74 + b2bRevenue * 0.7 + 7 + subsidy - fixedSavings - a.cost * 5;
  const spend = QUARTER_BUDGET * (1 - a.cost);
  const profit = revenue - opsCost - spend;
  cash += profit + eventCash;
  const burn = -profit / 3;
  const runway = round1(cash <= 0 ? 0 : burn <= 0 ? 36 : Math.min(36, cash / burn));

  nps = bound(nps + a.delivery * 22 + a.loyalty * 14 - a.cost * 18 - a.price * 2 - (morale < 45 ? 4 : 0) - 1.5, 0, 80);
  morale = bound(morale + a.delivery * 6 + a.b2b * 4 - a.cost * 30 + (share > state.share ? 2 : -2), 0, 100);

  const result: QuarterResult = {
    quarter: q,
    allocation,
    eventChoice,
    share,
    revenue: round1(revenue),
    profit: round1(profit),
    cash: round1(cash),
    runway,
    nps: Math.round(nps),
    morale: Math.round(morale),
    churn: round1(churn),
    deliveryMinutes: Math.round(deliveryMinutes),
  };

  return {
    quarter: q,
    structural,
    promo,
    share,
    cash: round1(cash),
    runway,
    nps: result.nps,
    morale: result.morale,
    churn: result.churn,
    deliveryMinutes: result.deliveryMinutes,
    loyalty,
    b2bRevenue,
    fixedSavings,
    boardDelta,
    history: [...state.history, result],
  };
}

/** The board's mood walking into the meeting (initial trust of the board-meeting dialogue). */
export function boardTrust(state: MarketState): number {
  return Math.round(
    bound(30 + (state.share - START_SHARE) * 4 + Math.min(state.runway, 18) - (state.runway < 6 ? 15 : 0) + state.boardDelta + (state.morale - 50) * 0.2, 10, 75),
  );
}

/** Mean absolute change in allocation between consecutive quarters (0 = perfectly consistent). */
export function allocationChurn(history: readonly QuarterResult[]): number {
  if (history.length < 2) return 0;
  let sum = 0;
  for (let i = 1; i < history.length; i++) {
    const prev = history[i - 1].allocation;
    const next = history[i].allocation;
    sum += (Object.keys(next) as Lever[]).reduce((s, k) => s + Math.abs(next[k] - prev[k]), 0) / 2;
  }
  return sum / (history.length - 1);
}
