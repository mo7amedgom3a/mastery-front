/** Observer rubric shared by the four deal-recovery labs. */
import { chosenOption, redlinableClauses, redlineTotals, sar } from "../../components/documents/doc-types";
import { learnerTalkShare, tagCount, type DialogueState } from "../../model/dialogue";
import { buildScorecard, clock } from "../../model/scoring";
import type { Dimension, Highlight, Scorecard } from "../../model/types";
import type { DealCrmEntry, DealScenario, DealStageId, Probability } from "./types";

export const ACCEPTANCE_TARGET = 70;
export const MARGIN_FLOOR = 60;

export type DealRun = {
  causes: readonly string[];
  call: DialogueState;
  redlines: Readonly<Record<string, string>>;
  crm: DealCrmEntry;
};

/** What the CRM should say after the call and the redline. */
export function expectedCrm(call: DialogueState, acceptance: number): { stages: DealStageId[]; probabilities: Probability[] } {
  if (call.outcome === "fail") return { stages: ["lost"], probabilities: [10] };
  if (call.outcome === "success" && acceptance >= ACCEPTANCE_TARGET) return { stages: ["negotiation", "awaiting-signature"], probabilities: [50, 70] };
  if (call.outcome === "success") return { stages: ["negotiation"], probabilities: [30, 50] };
  return { stages: ["stalled"], probabilities: [10, 30] };
}

export function scoreDealRecovery(
  scenario: DealScenario,
  run: DealRun,
): { scorecard: Scorecard; dealSaved: boolean; fairTerms: boolean } {
  const { call, redlines, crm } = run;
  const highlights: Highlight[] = [];

  // Diagnosis.
  const correct = scenario.rootCauses.filter((c) => c.correct);
  const hits = run.causes.filter((id) => correct.some((c) => c.id === id)).length;
  const misses = run.causes.filter((id) => !correct.some((c) => c.id === id));
  const diagnosis = (hits / correct.length) * 100 - misses.length * 25;
  for (const id of misses) {
    const cause = scenario.rootCauses.find((c) => c.id === id);
    if (cause) highlights.push({ at: "التشخيص", tone: "bad", text: `«${cause.label}»: ${cause.why}` });
  }
  if (hits === correct.length && !misses.length)
    highlights.push({ at: "التشخيص", tone: "good", text: "حددت الأسباب الحقيقية للتعثر من سجل الصفقة." });

  // The call.
  for (const entry of call.transcript) {
    if (entry.note) highlights.push({ at: clock(entry.at), tone: entry.note.tone, text: entry.note.text });
  }
  const base = call.outcome === "success" ? 62 : call.outcome === "neutral" ? 40 : 12;
  const callScore =
    base +
    tagCount(call, "empathy", "ownership", "listen") * 4 +
    tagCount(call, "objection-handle", "proof") * 5 -
    tagCount(call, "defensive", "blame", "competitor-bash", "overpromise", "pushy") * 10 -
    tagCount(call, "discount") * 6;

  // The document.
  const totals = redlineTotals(scenario.document, redlines, scenario.base);
  for (const clause of redlinableClauses(scenario.document)) {
    const option = chosenOption(clause, redlines);
    if (option?.note) highlights.push({ at: "العقد", tone: option.balanced ? "good" : "bad", text: option.note });
  }
  const proposalFit = totals.acceptance;
  const commercial = totals.margin >= MARGIN_FLOOR ? 70 + (totals.margin - MARGIN_FLOOR) * 0.9 : totals.margin;
  highlights.push({
    at: "العقد",
    tone: totals.acceptance >= ACCEPTANCE_TARGET && totals.margin >= MARGIN_FLOOR ? "good" : "info",
    text: `بعد تعديلاتك: قبول العميل ${totals.acceptance}٪ وهامش الشركة ${totals.margin}٪ والقيمة ${sar(totals.value)}.`,
  });

  // CRM.
  const expected = expectedCrm(call, totals.acceptance);
  let crmScore = 0;
  if (crm.stage && expected.stages.includes(crm.stage)) crmScore += 30;
  else highlights.push({ at: "الـCRM", tone: "bad", text: "مرحلة الصفقة لا تعكس نتيجة المكالمة والعرض المعدّل." });
  if (crm.probability && expected.probabilities.includes(crm.probability)) crmScore += 25;
  else highlights.push({ at: "الـCRM", tone: "bad", text: "احتمال الإغلاق المسجّل غير واقعي؛ التفاؤل في الـCRM يضلل التوقعات." });
  if (crm.value != null && Math.abs(crm.value - totals.value) <= totals.value * 0.1) crmScore += 25;
  else highlights.push({ at: "الـCRM", tone: "bad", text: `القيمة المسجلة لا تطابق العرض المعدّل (${sar(totals.value)}).` });
  const step = scenario.nextSteps.find((s) => s.id === crm.nextStep);
  if (step && call.outcome && step.validFor.includes(call.outcome)) crmScore += 20;
  else highlights.push({ at: "الـCRM", tone: "bad", text: "الخطوة التالية لا تطابق ما اتفقت عليه مع العميل." });

  // Talk ratio.
  const share = learnerTalkShare(call);
  const talk = share <= 55 && share >= 30 ? 100 : share > 55 ? 100 - (share - 55) * 3 : 100 - (30 - share) * 3;

  const dimensions: Dimension[] = [
    {
      key: "diagnosis",
      label: "تشخيص سبب التعثر",
      score: diagnosis,
      weight: 2,
      skill: "analysis",
      praise: "قرأت سجل الصفقة كمحقق وحددت الأسباب الحقيقية.",
      tip: "قبل الاتصال: اقرأ كل بريد وملاحظة في السجل، وفرّق بين ما قاله العميل وما افترضه الفريق.",
    },
    {
      key: "call",
      label: "مكالمة الاستعادة",
      score: callScore,
      weight: 3,
      skill: "persuasion",
      praise: "استمعت أولًا، وتحملت المسؤولية، ورددت على الاعتراض بأدلة.",
      tip: "مع عميل محبط: اعترف، اسأل عن الأثر، ثم اقترح علاجًا محددًا. لا خصم ولا دفاع في البداية.",
    },
    {
      key: "fit",
      label: "ملاءمة العرض للعميل",
      score: proposalFit,
      weight: 2,
      skill: "empathy",
      praise: "عدّلت البنود التي تمس ألم العميل الحقيقي.",
      tip: "عدّل البنود المرتبطة بأسباب التعثر، لا البنود السهلة فقط.",
    },
    {
      key: "commercial",
      label: "الانضباط التجاري",
      score: commercial,
      weight: 2,
      skill: "decision",
      praise: "حافظت على هامش الشركة دون تنازلات مجانية.",
      tip: "كل تنازل مقابل شيء: التزام، مدة، أو دفعة مقدمة. لا تتنازل عن كل البنود دفعة واحدة.",
    },
    {
      key: "crm",
      label: "دقة الـCRM",
      score: crmScore,
      weight: 1.5,
      skill: "execution",
      praise: "تحديث الـCRM واقعي ومطابق لما حدث.",
      tip: "سجّل المرحلة والاحتمال والقيمة كما هي فعلًا، لا كما تتمنى.",
    },
    {
      key: "talk",
      label: "نسبة الحديث والاستماع",
      score: talk,
      weight: 1,
      skill: "communication",
      praise: "تركت العميل يشرح أكثر مما تحدثت.",
      tip: "العميل المحبط يحتاج أن يتكلم؛ أسئلة أقصر واستماع أطول.",
    },
  ];

  const dealSaved = call.outcome === "success" && totals.acceptance >= ACCEPTANCE_TARGET;
  const fairTerms = totals.acceptance >= ACCEPTANCE_TARGET && totals.margin >= MARGIN_FLOOR;
  const verdict = dealSaved
    ? `أعدت الصفقة إلى الطاولة بعرض معدل قيمته ${sar(totals.value)}.`
    : call.outcome === "fail"
      ? "خسرت الصفقة نهائيًا في مكالمة الاستعادة."
      : call.outcome === "success"
        ? "العميل مستعد للحديث، لكن العقد المعدل لا يقنعه بعد."
        : "الصفقة ما زالت متعثرة بلا التزام واضح.";
  return { scorecard: buildScorecard({ dimensions, highlights, verdict }), dealSaved, fairTerms };
}
