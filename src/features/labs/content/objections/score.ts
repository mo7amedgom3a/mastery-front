/** Observer rubric shared by the two objection labs. */
import { buildScorecard, clamp } from "../../model/scoring";
import type { Dimension, Highlight, Scorecard } from "../../model/types";
import { objectionKinds, type ClassifyScenario, type ObjectionCrmEntry, type ObjectionRun, type RulerScenario } from "./types";

type CrmScore = { score: number; highlights: Highlight[] };

function scoreCrm(
  scenario: ClassifyScenario | RulerScenario,
  crm: ObjectionCrmEntry,
  expected: { stage: string; nextStep: string } | null,
): CrmScore {
  const highlights: Highlight[] = [];
  let score = 0;
  if (expected && crm.stage === expected.stage) score += 35;
  else highlights.push({ at: "الـCRM", tone: "bad", text: "مرحلة الصفقة لا تعكس الالتزام الذي حصلت عليه." });
  if (expected && crm.nextStep === expected.nextStep) score += 35;
  else highlights.push({ at: "الـCRM", tone: "bad", text: "الخطوة التالية المسجلة لا تطابق ما اتُّفق عليه." });
  const notes = crm.notes.reduce((sum, id) => {
    const note = scenario.crm.notes.find((entry) => entry.id === id);
    return sum + (note ? (note.correct ? 8 : -12) : 0);
  }, 0);
  score += clamp(notes, 0, 30);
  if (crm.notes.some((id) => scenario.crm.notes.find((entry) => entry.id === id)?.correct === false)) {
    highlights.push({ at: "الـCRM", tone: "bad", text: "سجّلت معلومة غير صحيحة عن العميل." });
  }
  return { score, highlights };
}

function tagCount(run: ObjectionRun, ...names: string[]): number {
  return run.rounds.reduce((sum, round) => sum + round.tags.filter((tag) => names.includes(tag)).length, 0);
}

function commitmentOf(scenario: ClassifyScenario | RulerScenario, id: string | null) {
  return scenario.commitment.options.find((option) => option.id === id) ?? null;
}

export function scoreObjectionTypes(
  scenario: ClassifyScenario,
  run: ObjectionRun,
): { scorecard: Scorecard; objectionReader: boolean } {
  const highlights: Highlight[] = [];
  const byId = new Map(run.rounds.map((round) => [round.roundId, round]));

  let classifyCorrect = 0;
  let bridgeCorrect = 0;
  let replyQuality = 0;
  for (const [index, round] of scenario.rounds.entries()) {
    const result = byId.get(round.id);
    if (!result) continue;
    const at = `الجولة ${index + 1}`;
    if (result.kind === round.kind) classifyCorrect++;
    else {
      highlights.push({ at, tone: "bad", text: `صنّفت الاعتراض خطأ؛ الصحيح: ${objectionKinds[round.kind].label}.` });
    }
    const bridge = round.bridges.find((option) => option.id === result.bridgeId);
    if (bridge?.correct) bridgeCorrect++;
    else if (bridge) highlights.push({ at, tone: "bad", text: bridge.why });
    const reply = round.replies.find((option) => option.id === result.replyId);
    if (reply) {
      replyQuality += reply.quality;
      if (reply.note) highlights.push({ at, tone: reply.note.tone, text: reply.note.text });
    }
  }
  if (classifyCorrect === scenario.rounds.length) {
    highlights.push({ at: "التصنيف", tone: "good", text: "صنّفت كل الاعتراضات بشكل صحيح: هذا نصف الحل." });
  }
  if (bridgeCorrect === scenario.rounds.length) {
    highlights.push({ at: "الجسور", tone: "good", text: "اخترت الجسر المناسب لكل نوع، ولم تخلط بينها." });
  }

  const commitment = commitmentOf(scenario, run.commitment);
  if (commitment?.note) highlights.push({ at: "الالتزام", tone: commitment.note.tone, text: commitment.note.text });
  const convert = ((replyQuality / (scenario.rounds.length * 2)) * 70) + ((commitment?.quality ?? 0) / 2) * 30;
  const trust = clamp(run.trust * 0.8 + tagCount(run, "proof", "benefit-barrier", "partner") * 6 - tagCount(run, "pushy", "defensive", "discount") * 10);
  const questions = clamp(tagCount(run, "closed-question", "convert", "benefit-barrier", "partner") * 20);
  const crm = scoreCrm(scenario, run.crm, commitment);
  highlights.push(...crm.highlights);

  const dimensions: Dimension[] = [
    {
      key: "classify",
      label: "تصنيف الاعتراض",
      score: (classifyCorrect / scenario.rounds.length) * 100,
      weight: 3,
      skill: "analysis",
      praise: "قرأت نوع كل اعتراض بدقة قبل أن ترد.",
      tip: "اسأل نفسك: هل العميل فهم غلط، أم يشك، أم يرى عيبًا، أم لا يحتاج، أم راضٍ عن منافس، أم يخفي السبب؟",
    },
    {
      key: "bridge",
      label: "اختيار الجسر",
      score: (bridgeCorrect / scenario.rounds.length) * 100,
      weight: 3,
      skill: "persuasion",
      praise: "استخدمت الجسر المناسب لكل نوع اعتراض.",
      tip: "لكل نوع جسر: توضيح، دليل، حاجز مزايا، GPS، مسطرة، أو أسئلة ضمائر.",
    },
    {
      key: "convert",
      label: "تحويل الاعتراض إلى التزام",
      score: convert,
      weight: 2,
      skill: "persuasion",
      praise: "أغلقت كل جولة بسؤال أو خطوة تحوّل الاعتراض إلى قرار.",
      tip: "لا تنهِ الرد بالتوضيح فقط؛ اتبعْه بسؤال مغلق أو خطوة محددة.",
    },
    {
      key: "trust",
      label: "الثقة والتعاطف",
      score: trust,
      weight: 2,
      skill: "empathy",
      praise: "حافظت على ثقة العميل وخفّضت التوتر.",
      tip: "ابدأ بالاعتراف بوجهة نظره قبل التصحيح أو العرض.",
    },
    {
      key: "questions",
      label: "جودة الأسئلة والإغلاق",
      score: questions,
      weight: 1.5,
      skill: "communication",
      praise: "استخدمت أسئلة مغلقة وأسئلة ضمائر في اللحظات المناسبة.",
      tip: "السؤال المفتوح يكشف، والسؤال المغلق يحوّل الكشف إلى التزام.",
    },
    {
      key: "crm",
      label: "دقة التوثيق",
      score: crm.score,
      weight: 1.5,
      skill: "execution",
      praise: "سجّلت المرحلة والخطوة والملاحظات كما حدثت.",
      tip: "الـCRM يعكس الواقع لا التفاؤل: المرحلة، صاحب القرار، والسعر الحقيقي.",
    },
  ];

  const verdict =
    commitment?.quality === 2
      ? "خرجت بتجربة محددة مع الشريك ومؤشرات نجاح مكتوبة."
      : commitment?.quality === 1
        ? "العميل مهتم، لكن الالتزام ما زال ناقصًا: لا تجربة ولا صاحب قرار."
        : "أغلقت بضغط أو خصم بدل معالجة الاعتراض الحقيقي.";

  return {
    scorecard: buildScorecard({ dimensions, highlights, verdict }),
    objectionReader: classifyCorrect === scenario.rounds.length,
  };
}

export function scoreRuler(
  scenario: RulerScenario,
  run: ObjectionRun,
): { scorecard: Scorecard; rulerMaster: boolean } {
  const highlights: Highlight[] = [];
  let stepCorrect = 0;
  let bashed = false;
  for (const step of scenario.steps) {
    const picked = run.rulerSteps[step.id];
    const option = step.options.find((entry) => entry.id === picked);
    if (option?.correct) stepCorrect++;
    else if (option) {
      highlights.push({ at: step.title, tone: "bad", text: option.why });
      if (step.id === "praise") bashed = true;
    }
    if (step.id === "praise" && picked === "ask-name") bashed = true;
  }
  if (stepCorrect === scenario.steps.length) {
    highlights.push({ at: "المسطرة", tone: "good", text: "طبّقت الخطوات الخمس كاملة دون أن تهاجم المنافس." });
  }

  const correctBenefits = scenario.benefits.filter((benefit) => benefit.correct);
  const pickedBenefits = scenario.benefits.filter((benefit) => run.benefits.includes(benefit.id));
  const right = pickedBenefits.filter((benefit) => benefit.correct).length;
  const wrong = pickedBenefits.filter((benefit) => !benefit.correct).length;
  for (const benefit of pickedBenefits) {
    if (benefit.correct) highlights.push({ at: "حاجز المزايا", tone: "good", text: benefit.why });
    else highlights.push({ at: "حاجز المزايا", tone: "bad", text: benefit.why });
  }

  const commitment = commitmentOf(scenario, run.commitment);
  if (commitment?.note) highlights.push({ at: "الالتزام", tone: commitment.note.tone, text: commitment.note.text });
  const crm = scoreCrm(scenario, run.crm, commitment);
  highlights.push(...crm.highlights);

  const hidden = (run.rulerSteps.praise === "no-name" ? 60 : 20) + (bashed ? 0 : 40);
  const amplify = (run.rulerSteps.amplify === "consequences" ? 50 : 0) + (run.rulerSteps["what-if"] === "what-if-offer" ? 50 : 0);
  const barrier = clamp((right / correctBenefits.length) * 100 - wrong * 25);
  const discipline = clamp(100 - (bashed ? 35 : 0) - (run.commitment === "discount" ? 35 : 0) - wrong * 10);

  const dimensions: Dimension[] = [
    {
      key: "hidden",
      label: "احتواء الاعتراض الخفي",
      score: hidden,
      weight: 2,
      skill: "empathy",
      praise: "اعترفت بجودة اختيار العميل ولم تجعله يدافع عن نفسه.",
      tip: "لا تطلب اسم المنافس ولا تهاجمه؛ ابدأ بالشكر والاعتراف.",
    },
    {
      key: "ruler",
      label: "تطبيق خطوات المسطرة",
      score: (stepCorrect / scenario.steps.length) * 100,
      weight: 3,
      skill: "analysis",
      praise: "مشيت في المسطرة بالترتيب حتى وصلت إلى سؤال «ماذا لو».",
      tip: "الترتيب هو التقنية: اعتراف ← تقييم ← فجوة ← تضخيم ← ماذا لو.",
    },
    {
      key: "amplify",
      label: "تضخيم أثر الفجوة",
      score: amplify,
      weight: 2.5,
      skill: "persuasion",
      praise: "حوّلت الفجوة إلى كلفة واضحة بالوقت والمال.",
      tip: "اسأل عن العواقب: ماذا يحدث للإقفال؟ للمستخلصات؟ للفريق؟",
    },
    {
      key: "barrier",
      label: "حاجز المزايا",
      score: barrier,
      weight: 2,
      skill: "persuasion",
      praise: "اخترت مزايا تعالج الفجوة التي سمّاها العميل.",
      tip: "لا تعرض كل المزايا؛ اعرض التي ترد على العيب الذي قاله العميل.",
    },
    {
      key: "close",
      label: "الالتزام والإغلاق",
      score: ((commitment?.quality ?? 0) / 2) * 100,
      weight: 2,
      skill: "execution",
      praise: "أغلقت بتجربة محدودة النطاق تحترم استمرارية العمل.",
      tip: "الخطوة التالية يجب أن تكون محددة: نطاق، مدة، مؤشرات، وصاحب قرار.",
    },
    {
      key: "discipline",
      label: "الانضباط التجاري",
      score: discipline,
      weight: 1.5,
      skill: "decision",
      praise: "لم تهاجم المنافس ولم تعرض خصمًا قبل كشف الفجوة.",
      tip: "الخصم والهجوم يهبطان قيمة العرض؛ اجعلهما آخر خيار.",
    },
  ];

  const verdict =
    commitment?.quality === 2
      ? "حوّلت عميلًا راضيًا عن المنافس إلى تجربة محددة على شركة واحدة."
      : commitment?.quality === 1
        ? "فتحت الفجوة، لكنك لم تغلقها بتجربة واضحة."
        : "أضعت الفجوة بخصم أو ضغط، فعاد العميل إلى موقعه الدفاعي.";

  return {
    scorecard: buildScorecard({ dimensions, highlights, verdict }),
    rulerMaster: stepCorrect === scenario.steps.length && !bashed,
  };
}
