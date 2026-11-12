/** Observer rubric for the sales-failure week: plan, numbers, questions, rejection, GPS, follow-up. */
import { buildScorecard, clamp } from "../../model/scoring";
import type { Dimension, Highlight, Scorecard } from "../../model/types";
import type {
  ActivityId,
  CauseId,
  CauseStatus,
  FunnelAnswer,
  FunnelTargets,
  SalesFailureRun,
  SalesFailureScenario,
  WeekPlan,
} from "./types";

/** The funnel maths the learner has to reproduce: 6 deals → 20 proposals → 40 meetings → 200 calls → 400 prospects. */
export function requiredFunnel(targets: FunnelTargets): FunnelAnswer {
  const proposals = Math.ceil(targets.deals / targets.proposalToClose);
  const meetings = Math.ceil(proposals / targets.meetingToProposal);
  const calls = Math.ceil(meetings / targets.callToMeeting);
  const prospects = Math.ceil(calls / targets.prospectToCall);
  return { prospects, calls, meetings, proposals };
}

export function planStats(plan: WeekPlan, activities: readonly { id: ActivityId; core: boolean }[]) {
  const counts = new Map<ActivityId, number>();
  for (const day of Object.values(plan)) {
    for (const id of day) counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  const core = activities.filter((activity) => activity.core).map((activity) => activity.id);
  const covered = core.filter((id) => (counts.get(id) ?? 0) > 0).length;
  const max = Math.max(0, ...counts.values());
  const balanced = covered === core.length && max <= 3;
  const score = clamp((covered / core.length) * 70 + (balanced ? 30 : Math.max(0, 30 - (max - 3) * 10)));
  return { covered, total: core.length, max, balanced, score };
}

type Flags = {
  planBalanced: boolean;
  funnelMaster: boolean;
  questionsRight: boolean;
  rejectionProof: boolean;
  followUpSet: boolean;
};

export function causeStatuses(run: SalesFailureRun, flags: Flags): Record<CauseId, CauseStatus> {
  const tags = run.call.tags;
  const avoided = (value: boolean): CauseStatus => (value ? "avoided" : "missed");
  return {
    rejection: avoided(flags.rejectionProof),
    objections: avoided(tags.includes("gps-problem") || tags.includes("gps-amplify") || tags.includes("gps-solution")),
    mindset: avoided(flags.planBalanced),
    plan: avoided(flags.planBalanced),
    questions: avoided(flags.questionsRight),
    numbers: avoided(flags.funnelMaster),
    emotions: avoided(run.call.outcome !== "fail" && !tags.includes("pushy") && !tags.includes("giveup") && !tags.includes("discount")),
    depth: avoided(tags.includes("implication") || tags.includes("gps-amplify")),
    followup: avoided(flags.followUpSet),
    learning: avoided(run.postPercent >= 66),
  };
}

export function scoreSalesFailure(
  scenario: SalesFailureScenario,
  run: SalesFailureRun,
): { scorecard: Scorecard; rejectionProof: boolean; funnelMaster: boolean; causes: Record<CauseId, CauseStatus> } {
  const highlights: Highlight[] = [];
  const required = requiredFunnel(scenario.funnel);
  const plan = planStats(run.plan, scenario.activities);

  // Plan.
  if (plan.balanced) {
    highlights.push({ at: "الخطة", tone: "good", text: "أسبوع متوازن يغطي التنقيب والمكالمات والزيارات والمتابعة والعروض." });
  } else {
    highlights.push({
      at: "الخطة",
      tone: "bad",
      text: `غطّيت ${plan.covered} من ${plan.total} أنشطة أساسية. الافتقار لخطة أحد أسباب فشل المبيعات.`,
    });
  }

  // Funnel.
  const fields: { key: keyof FunnelAnswer; label: string }[] = [
    { key: "prospects", label: "العملاء المحتملون" },
    { key: "calls", label: "المكالمات" },
    { key: "meetings", label: "الاجتماعات" },
    { key: "proposals", label: "عروض السعر" },
  ];
  let exact = 0;
  for (const field of fields) {
    if (run.funnel[field.key] === required[field.key]) {
      exact++;
    } else {
      highlights.push({
        at: "القمع",
        tone: "bad",
        text: `${field.label}: أدخلت ${run.funnel[field.key]} والمطلوب ${required[field.key]}.`,
      });
    }
  }
  if (exact === fields.length) {
    highlights.push({ at: "القمع", tone: "good", text: "معادلة القمع صحيحة: تعرف بالضبط كم عميلًا تحتاج." });
  }

  // Question bank.
  const correctQuestions = scenario.questionBank.filter((question) => question.correct);
  const pickedCorrect = correctQuestions.filter((question) => run.questions.includes(question.id)).length;
  const pickedWrong = scenario.questionBank.filter((question) => !question.correct && run.questions.includes(question.id));
  for (const question of pickedWrong) {
    highlights.push({ at: "الأسئلة", tone: "bad", text: question.why });
  }
  if (pickedCorrect === correctQuestions.length && !pickedWrong.length) {
    highlights.push({ at: "الأسئلة", tone: "good", text: "اخترت أسئلة تفتح الوضع والمشكلة والأثر، لا أسئلة بيع مباشرة." });
  }

  // The call.
  highlights.push(...run.call.notes);
  const tags = run.call.tags;
  const gpsSteps = ["gps-fact", "gps-problem", "gps-amplify", "gps-solution"].filter((tag) => tags.includes(tag)).length;
  const callBase = run.call.outcome === "success" ? 70 : run.call.outcome === "neutral" ? 40 : 10;
  const rejectionScore = clamp(
    callBase + (tags.includes("gps-fact") ? 10 : 0) + (tags.includes("recovery") ? 10 : 0) - (tags.includes("giveup") ? 20 : 0) - (tags.includes("pushy") ? 15 : 0),
  );
  const rejectionProof = (run.call.outcome === "success" || run.call.outcome === "neutral") && tags.includes("gps-fact") && !tags.includes("giveup");
  const gpsScore = (gpsSteps / 4) * 100;
  const gpsMaster = gpsSteps === 4 && run.call.outcome === "success";

  // Follow-up.
  const slots: (1 | 2 | 3)[] = [1, 2, 3];
  let followCorrect = 0;
  for (const slot of slots) {
    const picked = scenario.followUp.find((option) => option.id === run.followUp[slot]);
    if (picked?.correct) followCorrect++;
    else if (picked) highlights.push({ at: "المتابعة", tone: "bad", text: picked.why });
  }
  const followUpSet = followCorrect === slots.length;
  if (followUpSet) {
    highlights.push({ at: "المتابعة", tone: "good", text: "ثلاث لمسات بمواعيد وأسباب: المتابعة ليست تذكيرًا، بل استمرار للحل." });
  }

  const funnelMaster = exact === fields.length;
  const questionsRight = pickedCorrect === correctQuestions.length && !pickedWrong.length;
  const causes = causeStatuses(run, {
    planBalanced: plan.balanced,
    funnelMaster,
    questionsRight,
    rejectionProof,
    followUpSet,
  });
  const avoidedCount = Object.values(causes).filter((status) => status === "avoided").length;
  highlights.push({ at: "الأسباب العشرة", tone: avoidedCount >= 7 ? "good" : "info", text: `نجوت من ${avoidedCount} من 10 أسباب لفشل المبيعات.` });

  const dimensions: Dimension[] = [
    {
      key: "plan",
      label: "خطة الأسبوع",
      score: plan.score,
      weight: 2,
      skill: "execution",
      praise: "بنيت أسبوعًا يغطي التنقيب والمكالمات والزيارات والمتابعة والعروض.",
      tip: "كل جهد منظم عائده مضاعف: خصّص أيامًا للتنقيب وأيامًا للزيارات والمتابعة.",
    },
    {
      key: "funnel",
      label: "معادلة القمع",
      score: (exact / fields.length) * 100,
      weight: 2.5,
      skill: "analysis",
      praise: "حسبت عدد العملاء المطلوب من معدلات التحويل، لا من الإحساس.",
      tip: "اعمل من النهاية: الصفقات ÷ نسبة الإغلاق = العروض، ثم الاجتماعات، ثم المكالمات.",
    },
    {
      key: "questions",
      label: "بنك الأسئلة والتعمق",
      score: clamp((pickedCorrect / correctQuestions.length) * 100 - pickedWrong.length * 20),
      weight: 2,
      skill: "analysis",
      praise: "أسئلتك تفتح الوضع والمشكلة والأثر قبل أي عرض.",
      tip: "من يطرح الأسئلة يقود الحوار: اسأل عن الوضع، ثم المشكلة، ثم الأثر، ثم عائد الحل.",
    },
    {
      key: "rejection",
      label: "إدارة الرفض والمشاعر",
      score: rejectionScore,
      weight: 2,
      skill: "empathy",
      praise: "لم تأخذ «ما نحتاج» على أنها نهاية، ولم تضغط بعد الرفض.",
      tip: "الرفض ليس عنك: اسأل سؤالًا واحدًا محددًا بدل أن تعرض أو تنسحب.",
    },
    {
      key: "gps",
      label: "خلق الاحتياج (GPS)",
      score: gpsScore,
      weight: 2.5,
      skill: "persuasion",
      praise: "استخدمت الحقيقة الجاذبة، ثم المشكلة وتضخيمها، ثم الحل.",
      tip: "لا تبدأ بالحل: ابدأ بحقيقة تفتح العقل، ثم اجعل المشكلة ملموسة، ثم اعرض الحل.",
    },
    {
      key: "followup",
      label: "المتابعة",
      score: (followCorrect / slots.length) * 100,
      weight: 2,
      skill: "execution",
      praise: "ثبّتت متابعة بمواعيد وسبب ومحتوى مخصص.",
      tip: "المتابعة بلا سبب وموعد مجرد إزعاج؛ اربط كل لمسة بقيمة جديدة.",
    },
  ];

  const verdict =
    run.call.outcome === "success" && gpsMaster && funnelMaster && followUpSet
      ? "أسبوع كامل: خطة، أرقام، اكتشاف، ومتابعة — حوّلت «ما نحتاج» إلى تقييم محدد."
      : run.call.outcome === "success"
        ? "أغلقت التقييم، لكن بعض أسباب فشل المبيعات ما زالت مفتوحة في تقييمك."
        : run.call.outcome === "neutral"
          ? "وعدت بتقرير بلا موعد: المتابعة هي الفرق بين «بشوف» والصفقة."
          : "الرفض الأولي أوقفك؛ هذا أول أسباب فشل المبيعات: الخوف من الرفض.";

  return {
    scorecard: buildScorecard({ dimensions, highlights, verdict }),
    rejectionProof,
    funnelMaster,
    causes,
  };
}
