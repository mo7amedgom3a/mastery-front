/**
 * Marketing Ad Lab: quizzes and the observer rubric for a finished campaign.
 */
import {
  COMPETITOR_DAYS,
  COMPETITOR_PLATFORMS,
  FATIGUE_WARNING,
  TARGET_IMPRESSIONS,
  TARGET_LIKES,
  TOTAL_BUDGET,
  audienceFit,
  audienceSize,
  creativeQuality,
  sizeVerdict,
  totals,
  type Campaign,
} from "../model/ad-market";
import { buildScorecard } from "../model/scoring";
import type { Dimension, Highlight, QuizQuestion, Scorecard } from "../model/types";
import { formatNumber } from "@/lib/format";

export const marketingPreQuiz: readonly QuizQuestion[] = [
  {
    prompt: "لديك ميزانية صغيرة جدًا لعلامة محلية جديدة. كيف تختار الجمهور؟",
    options: [
      { label: "أوسع جمهور ممكن للحصول على أكبر وصول", points: 0, style: "assertive" },
      { label: "جمهور محدد قريب من المتجر ومهتم بالمنتج، دون تضييق مفرط", points: 2, style: "analytical" },
      { label: "أنسخ استهداف أكبر منافس", points: 1, style: "avoidant" },
    ],
    explain: "الميزانية الصغيرة تنجح مع جمهور ملائم بحجم معقول: لا ضيق يرفع التكلفة، ولا اتساع يضيّع الملاءمة.",
  },
  {
    prompt: "أي إعلان يُتوقع أن يحقق تفاعلًا أعلى على تيك توك؟",
    options: [
      { label: "صورة الشعار مع نص كبير", points: 0, style: "avoidant" },
      { label: "فيديو قصير يُظهر المنتج بشكل جذاب", points: 2, style: "analytical" },
      { label: "إعلان خصم كبير بخط أحمر", points: 1, style: "assertive" },
    ],
    explain: "المحتوى الأصلي للمنصة (فيديو قصير) يتفاعل أفضل ويكلّف أقل.",
  },
  {
    prompt: "في اليوم الرابع ارتفعت تكلفة الألف ظهور فجأة 40٪ على منصة واحدة. ماذا تفعل؟",
    options: [
      { label: "أضاعف الميزانية على نفس المنصة لأحافظ على الظهور", points: 0, style: "assertive" },
      { label: "أنقل جزءًا من الميزانية لمنصة أرخص مؤقتًا وأراقب", points: 2, style: "analytical" },
      { label: "أوقف الحملة بالكامل", points: 0, style: "avoidant" },
    ],
    explain: "إعادة التوزيع المرنة بين المنصات تحمي الكفاءة عند ارتفاع المنافسة.",
  },
  {
    prompt: "التفاعل يتراجع يومًا بعد يوم والتكرار مرتفع. السبب الأرجح؟",
    options: [
      { label: "ملل الجمهور من نفس الإعلان (Ad fatigue)", points: 2, style: "analytical" },
      { label: "المنصة تعاقب الحساب", points: 0, style: "avoidant" },
      { label: "الميزانية منخفضة", points: 1, style: "assertive" },
    ],
    explain: "التكرار العالي لنفس الإبداع يرفع التكلفة ويخفض التفاعل؛ الحل نسخة جديدة.",
  },
  {
    prompt: "هدفك إعجابات وتفاعل. أي استراتيجية مزايدة أنسب؟",
    options: [
      { label: "المزايدة على الوصول (أرخص ظهور)", points: 1, style: "assertive" },
      { label: "المزايدة على التفاعل", points: 2, style: "analytical" },
      { label: "لا يهم", points: 0, style: "avoidant" },
    ],
    explain: "المزايدة على التفاعل ترفع تكلفة الظهور قليلًا لكنها تصل لمن يتفاعل فعلًا.",
  },
];

export const marketingPostQuiz: readonly QuizQuestion[] = [
  {
    prompt: "ما مقياس «التكلفة لكل تفاعل» (CPE)؟",
    options: [
      { label: "الإنفاق ÷ عدد التفاعلات", points: 2 },
      { label: "الظهور ÷ الإنفاق", points: 0 },
      { label: "التفاعلات ÷ الظهور", points: 0 },
    ],
    explain: "CPE = الإنفاق ÷ التفاعلات، ويقيس كفاءة الميزانية في توليد التفاعل.",
  },
  {
    prompt: "لماذا يرفع الجمهور الضيق جدًا تكلفة الظهور؟",
    options: [
      { label: "لأن المنصة تفرض رسومًا إضافية على الاستهداف", points: 0 },
      { label: "لأن نفس الأشخاص يُعرض عليهم الإعلان مرارًا وتشتد المنافسة عليهم", points: 2 },
      { label: "لا يرفعها", points: 0 },
    ],
    explain: "الجمهور الصغير يتشبع بسرعة: تكرار أعلى وتكلفة أعلى.",
  },
  {
    prompt: "ما أفضل رد فعل عند ظهور التعب الإعلاني؟",
    options: [
      { label: "زيادة الميزانية", points: 0 },
      { label: "إطلاق نسخة إبداعية جديدة", points: 2 },
      { label: "تغيير المدينة", points: 0 },
    ],
    explain: "تجديد الإبداع يعيد ضبط التكرار ويستعيد التفاعل.",
  },
];

export function scoreMarketing(campaign: Campaign): { scorecard: Scorecard; targetMet: boolean } {
  const { plan, days } = campaign;
  const t = totals(campaign);
  const highlights: Highlight[] = [];
  const size = audienceSize(plan);
  const fit = audienceFit(plan);
  const verdictSize = sizeVerdict(size);

  // Target attainment.
  const impressionsShare = Math.min(1, t.impressions / TARGET_IMPRESSIONS);
  const likesShare = Math.min(1, t.likes / TARGET_LIKES);
  const target = impressionsShare * 50 + likesShare * 50;
  const targetMet = t.impressions >= TARGET_IMPRESSIONS && t.likes >= TARGET_LIKES;

  // Cost efficiency: CPE 0.04$ → 100, 0.15$ → 0.
  const efficiency = t.likes ? 100 - ((t.cpe - 0.04) / 0.11) * 100 : 0;

  // Creative: average quality across the platforms used, final creative.
  const creative =
    (plan.platforms.reduce((sum, p) => sum + Math.min(1, creativeQuality(plan.creative, p)), 0) / Math.max(1, plan.platforms.length)) * 100;

  // Adaptation: reacted to the competitor and to fatigue.
  let adaptation = 40;
  const before = days.find((d) => d.day === COMPETITOR_DAYS[0] - 1);
  for (const day of days.filter((d) => d.competitor)) {
    const exposedNow = COMPETITOR_PLATFORMS.reduce((sum, p) => sum + (day.split[p] ?? 0), 0);
    const exposedBefore = before ? COMPETITOR_PLATFORMS.reduce((sum, p) => sum + (before.split[p] ?? 0), 0) : exposedNow;
    const avoided = exposedNow === 0 || exposedNow + 10 <= exposedBefore || day.spend < (before?.spend ?? day.spend) * 0.8;
    if (avoided) {
      adaptation += 15;
      highlights.push({ at: `اليوم ${day.day}`, tone: "good", text: "تفاديت ارتفاع الأسعار وقت عرض المنافس بإعادة توزيع الميزانية." });
    } else if (exposedNow > 0) {
      highlights.push({ at: `اليوم ${day.day}`, tone: "bad", text: "عرض المنافس رفع تكلفة الظهور وبقيت ميزانيتك على نفس المنصات." });
    }
  }
  const fatigueDays = days.filter((d) => d.frequency >= FATIGUE_WARNING && !d.refreshed);
  const refreshes = days.filter((d) => d.refreshed);
  if (fatigueDays.length) {
    adaptation -= fatigueDays.length * 8;
    highlights.push({
      at: `اليوم ${fatigueDays[0].day}`,
      tone: "bad",
      text: `استمر نفس الإعلان رغم التكرار المرتفع (${fatigueDays[0].frequency.toFixed(1)}) فتراجع التفاعل.`,
    });
  }
  if (refreshes.length) {
    adaptation += Math.min(2, refreshes.length) * 15;
    highlights.push({ at: `اليوم ${refreshes[0].day}`, tone: "good", text: "جددت الإعلان لمواجهة التعب الإعلاني." });
  }
  if (!fatigueDays.length && !refreshes.length) adaptation += 15;

  // Budget discipline: use the budget, don't leave much unspent.
  const unused = TOTAL_BUDGET - t.spend;
  const discipline = 100 - Math.max(0, unused - 5) * 3;
  if (unused > 10) highlights.push({ at: "الميزانية", tone: "info", text: `بقي ${formatNumber(Math.round(unused))}$ دون إنفاق.` });

  if (verdictSize === "narrow")
    highlights.unshift({ at: "الجمهور", tone: "bad", text: `جمهور ضيق جدًا (${formatNumber(size)} شخص): التكرار ارتفع بسرعة وغلت التكلفة.` });
  else if (verdictSize === "broad")
    highlights.unshift({ at: "الجمهور", tone: "bad", text: `جمهور واسع جدًا (${formatNumber(size)} شخص): ضاعت الملاءمة مع عملاء المحمصة.` });
  else highlights.unshift({ at: "الجمهور", tone: "good", text: `حجم جمهور مناسب (${formatNumber(size)} شخص) وملاءمة ${Math.round(fit * 100)}٪.` });

  // Day-stamped observations in campaign order, after the general ones.
  const dayOf = (h: Highlight) => Number(h.at.match(/^اليوم (\d+)$/)?.[1] ?? 0);
  highlights.sort((a, b) => dayOf(a) - dayOf(b));

  const dimensions: Dimension[] = [
    {
      key: "target",
      label: "تحقيق الهدف",
      score: target,
      weight: 3,
      skill: "execution",
      praise: "حققت هدفي الظهور والتفاعل.",
      tip: "خطّط بالأرقام: 50 ألف ظهور بـ100$ تعني تكلفة ألف ظهور أقل من 2$.",
    },
    {
      key: "efficiency",
      label: "كفاءة التكلفة",
      score: efficiency,
      weight: 2,
      skill: "analysis",
      praise: `تكلفة التفاعل ${t.cpe.toFixed(3)}$ فقط: كفاءة عالية.`,
      tip: "اخفض تكلفة التفاعل بالجمع بين جمهور ملائم وإبداع قوي ومزايدة على التفاعل.",
    },
    {
      key: "audience",
      label: "ملاءمة الجمهور",
      score: fit * 100,
      weight: 1.5,
      skill: "analysis",
      praise: "اخترت جمهورًا يشبه عملاء المحمصة الحقيقيين.",
      tip: "ابدأ من العميل الحقيقي: المدينة التي فيها المتجر، والفئة العمرية، والاهتمام المباشر بالمنتج.",
    },
    {
      key: "creative",
      label: "جودة الإعلان",
      score: creative,
      weight: 1.5,
      skill: "communication",
      praise: "إعلان أصيل يناسب المنصة ويحكي قصة المنتج.",
      tip: "تجنب العناوين العامة والخصومات الصاخبة؛ القصة والفيديو القصير يتفاعلان أكثر.",
    },
    {
      key: "adaptation",
      label: "التكيّف أثناء الحملة",
      score: adaptation,
      weight: 1.5,
      skill: "decision",
      praise: "قرأت لوحة الأداء يوميًا وتصرفت عند تغيّر السوق.",
      tip: "راقب التكرار وتكلفة الألف ظهور يوميًا: انقل الميزانية وجدد الإعلان عند الحاجة.",
    },
    {
      key: "discipline",
      label: "انضباط الميزانية",
      score: discipline,
      weight: 1,
      skill: "execution",
      praise: "استثمرت الميزانية كاملة دون تجاوز.",
      tip: "وزّع الميزانية على الأيام كلها؛ المال غير المنفق فرصة ضائعة.",
    },
  ];

  const verdict = targetMet
    ? `حققت الهدف: ${formatNumber(t.impressions)} ظهور و${formatNumber(t.likes)} تفاعل بـ${t.spend.toFixed(0)}$.`
    : `لم يتحقق الهدف: ${formatNumber(t.impressions)} ظهور و${formatNumber(t.likes)} تفاعل.`;
  return { scorecard: buildScorecard({ dimensions, highlights, verdict }), targetMet };
}
