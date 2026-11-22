/**
 * Port: Sales discovery call (Tarek / Apex) → engine `sales-discovery` on the `dialogue` runtime.
 * Mirrors `scoreSales` in `content/sales.ts` term by term.
 */
import {
  correctNextStep,
  correctStage,
  crmNextSteps,
  crmNoteOptions,
  crmStages,
  emailBlocks,
  hypotheses,
  salesCall,
  salesFacts,
  scoreSales,
  type CrmEntry,
} from "../../src/features/labs/content/sales";
import { findLab } from "../../src/features/labs/model/catalog";
import type { DialogueScenarioDoc } from "../../src/features/labs/model/dialogue-runtime";
import { assertSamePlay, c, classicConfig, expected, graphStage, meter, persona, pick, rng, sample, T, tagLt, walk, type Port, type PortCase } from "./common";

const CAP = 40_000;
const crm = (field: string) => `answers.crm.${field}`;
const OUTCOMES = ["success", "fail", "neutral"] as const;
const isOutcome = (outcome: string) =>
  outcome === "neutral" ? [c("outcome", "neq", "success"), c("outcome", "neq", "fail")] : [c("outcome", "eq", outcome)];

export function salesPort(): Port {
  const lab = findLab("sales-discovery-call")!;
  const call = graphStage(salesCall, {
    id: "call",
    title: salesCall.title,
    guards: {
      // tarekGuards.tooEarly / trusted / patience ≤ 0
      redirect: {
        [Object.entries(salesCall.nodes).find(([, n]) => n.redirect?.[0]?.to === "generic")![0]]: [[tagLt("open-question", 3)]],
        [Object.entries(salesCall.nodes).find(([, n]) => n.redirect?.[0]?.to === "close")![0]]: [[meter("trust", "gte", 60)]],
      },
      breakpoints: [[meter("patience", "lte", 0)]],
    },
  });

  const scenario: DialogueScenarioDoc = {
    intro: lab.scenario,
    speakers: { tarek: { slot: "buyer" } },
    facts: Object.entries(salesFacts).map(([id, label]) => ({ id, label })),
    stages: [
      {
        id: "prep",
        type: "select",
        title: "التحضير: فرضيات قبل المكالمة",
        prompt: "اختر الفرضيات التي تتوقع أن تكون مصدر ألم العميل.",
        multiple: true,
        options: hypotheses.map((h) => ({ id: h.id, label: h.label, correct: h.correct })),
      },
      call,
      {
        id: "crm",
        type: "form",
        title: "تسجيل المكالمة في الـCRM",
        fields: [
          { id: "stage", label: "مرحلة الصفقة", kind: "select", options: crmStages.map((s) => ({ id: s.id, label: s.label })) },
          { id: "deal_value", label: "قيمة الصفقة السنوية", kind: "number", unit: "$" },
          { id: "notes", label: "ملاحظات المكالمة", kind: "multiselect", options: crmNoteOptions.map((o) => ({ id: o.id, label: o.label })) },
          { id: "next_step", label: "الخطوة التالية", kind: "select", options: crmNextSteps.map((s) => ({ id: s.id, label: s.label })) },
        ],
      },
      {
        id: "email",
        type: "select",
        title: "إيميل المتابعة",
        prompt: "ركّب إيميل المتابعة من الفقرات المناسبة.",
        multiple: true,
        options: emailBlocks.map((b) => ({ id: b.id, label: b.text })),
      },
    ],
  };

  // CRM: correct stage / next step depend on the outcome.
  const stageTerms = OUTCOMES.map((outcome) => T.if([...isOutcome(outcome), c(crm("stage"), "in", correctStage(outcome === "neutral" ? "neutral" : outcome))], 25));
  const stepTerms = OUTCOMES.map((outcome) => T.if([...isOutcome(outcome), c(crm("next_step"), "in", correctNextStep(outcome === "neutral" ? "neutral" : outcome))], 20));
  const stageWrong = OUTCOMES.map((outcome) => ({
    when: [...isOutcome(outcome), ...correctStage(outcome === "neutral" ? "neutral" : outcome).map((id) => c(crm("stage"), "neq", id))],
    at: "الـCRM",
    tone: "bad",
    text: "مرحلة الصفقة لا تعكس نتيجة المكالمة.",
  }));
  const stepWrong = OUTCOMES.map((outcome) => ({
    when: [...isOutcome(outcome), ...correctNextStep(outcome === "neutral" ? "neutral" : outcome).map((id) => c(crm("next_step"), "neq", id))],
    at: "الـCRM",
    tone: "bad",
    text: "الخطوة التالية المسجلة لا تطابق ما اتُّفق عليه.",
  }));
  const noteTerms = crmNoteOptions.flatMap((option) =>
    option.fact === null
      ? [T.if([c(crm("notes"), "contains", option.id)], -10)]
      : [
          T.if([c(crm("notes"), "contains", option.id), c(`fact.${option.fact}`, "eq", true)], 7),
          T.if([c(crm("notes"), "contains", option.id), c(`fact.${option.fact}`, "neq", true)], -10),
        ],
  );
  const emailTerms = emailBlocks.flatMap((block) => {
    const picked = c("answers.email", "contains", block.id);
    if (block.wrong) return [T.if([picked], -30)];
    const needs = [...(block.needs ?? []).map((fact) => c(`fact.${fact}`, "eq", true)), ...(block.needsSuccess ? [c("outcome", "eq", "success")] : [])];
    if (!needs.length) return [T.if([picked], 20)];
    const missing = [...(block.needs ?? []).map((fact) => c(`fact.${fact}`, "neq", true)), ...(block.needsSuccess ? [c("outcome", "neq", "success")] : [])];
    return [T.if([picked, ...needs], 20), T.if([picked], -5, { any: missing })];
  });

  const rubric = {
    run_notes_first: true,
    dimensions: [
      {
        key: "discovery", label: { ar: "جودة الاكتشاف", en: "Discovery" }, skill: "analysis", weight: 3,
        terms: [T.count("facts", 13), T.tags(["open-question"], 4, { cap: 5 }), T.count("stages.prep.correct", 5)],
        praise: "اكتشفت {{counts.facts}} من 5 معلومات جوهرية عن العميل.",
        tip: "اسأل أسئلة مفتوحة عن الوضع ثم المشكلة ثم الأثر قبل أي عرض (SPIN).",
      },
      {
        key: "objection", label: { ar: "التعامل مع الاعتراضات", en: "Objection handling" }, skill: "persuasion", weight: 2,
        terms: [
          T.if([c("visited", "contains", "competitor-objection")], 55, { else_points: 25 }),
          T.tags(["objection-handle"], 15),
          T.tags(["risk-reversal", "proof"], 8),
          T.tags(["competitor-bash"], -25),
          T.tags(["discount", "price-dump"], -15),
          T.tags(["defensive", "overpromise"], -15),
        ],
        praise: "رددت على الاعتراضات بأدلة من كلام العميل نفسه.",
        tip: "لا تهاجم المنافس ولا تقدّم خصمًا فوريًا؛ اربط ردك بالمشكلة التي اكتشفتها.",
      },
      {
        key: "rapport", label: { ar: "الثقة والتعاطف", en: "Rapport" }, skill: "empathy", weight: 2,
        terms: [T.value("meters.trust", 0.8), T.tags(["empathy", "listen", "rapport"], 8), T.tags(["pushy"], -10)],
        praise: "بنيت ثقة واضحة وتعاملت مع غضب العميل بهدوء.",
        tip: "عند الغضب: اعترف بالشعور، ثم اسأل «ماذا حدث بالضبط؟» قبل أي دفاع.",
      },
      {
        key: "closing", label: { ar: "الإغلاق والخطوة التالية", en: "Closing" }, skill: "persuasion", weight: 2, base: 10,
        terms: [
          T.if([c("outcome", "eq", "success")], 90),
          T.if([c("outcome", "eq", "neutral"), c("tags.close", "gte", 1)], 40),
          T.if([c("outcome", "eq", "neutral"), c("tags.close", "lt", 1)], 25),
        ],
        praise: "أغلقت بموعد محدد مع صاحب القرار.",
        tip: "حوّل «أرسل لي إيميل» إلى سؤال: ما الذي يحتاجه صاحب القرار ليوافق؟",
      },
      {
        key: "crm", label: { ar: "دقة الـCRM", en: "CRM accuracy" }, skill: "execution", weight: 2,
        terms: [
          ...stageTerms,
          ...stepTerms,
          T.if([c(crm("deal_value"), "gt", 0)], 20, { any: [c("fact.budget", "neq", true), c(crm("deal_value"), "lte", CAP)] }),
          T.group(noteTerms, 0, 35),
        ],
        praise: "سجلاتك في الـCRM دقيقة ومطابقة لما قيل.",
        tip: "سجّل ما سمعته فعلًا: المرحلة الحقيقية، قيمة ضمن السقف، والخطوة المتفق عليها.",
      },
      {
        key: "email", label: { ar: "إيميل المتابعة", en: "Follow-up email" }, skill: "communication", weight: 1, base: 20,
        terms: emailTerms,
        praise: "إيميل متابعة دقيق يلخّص الاتفاق دون وعود مبالغ فيها.",
        tip: "لخّص ألم العميل بكلماته، واقترح خطوة واضحة، وتجنب الوعود التي لا تملكها.",
      },
      {
        key: "talk", label: { ar: "نسبة الحديث والاستماع", en: "Talk ratio" }, skill: "communication", weight: 1,
        terms: [T.range("talk_share", 35, 55, 100, 3)],
        praise: "حافظت على توازن صحي بين الحديث والاستماع.",
        tip: "اترك العميل يتحدث أكثر: أسئلة أقصر وعرض أقل.",
      },
    ],
    verdicts: [
      { when: [c("outcome", "eq", "success")], text: "حجزت اجتماعًا مع طارق والمدير المالي." },
      { when: [c("outcome", "eq", "fail")], text: "أنهى طارق المكالمة قبل أن تصل إلى خطوة تالية." },
      { when: [], text: "انتهت المكالمة بلا موعد محدد: «أرسل لي إيميل»." },
    ],
    highlights: [
      ...stageWrong,
      ...stepWrong,
      {
        when: [c(crm("deal_value"), "gt", CAP), c("fact.budget", "eq", true)], at: "الـCRM", tone: "bad",
        text: "سجّلت قيمة {{answers.crm.deal_value:n}}$ بينما سقف الميزانية المعلن 40,000$.",
      },
      { when: [], any: [c(crm("deal_value"), "eq", null), c(crm("deal_value"), "lte", 0)], at: "الـCRM", tone: "bad", text: "قيمة الصفقة غير مسجلة." },
      {
        when: [], any: crmNoteOptions.filter((o) => o.fact === null).map((o) => c(crm("notes"), "contains", o.id)),
        at: "الـCRM", tone: "bad", text: "سجّلت معلومة لم يقلها العميل.",
      },
      ...emailBlocks.filter((b) => b.wrong).map((b) => ({ when: [c("answers.email", "contains", b.id)], at: "الإيميل", tone: "bad", text: b.wrong! })),
      { when: [c("talk_share", "gt", 60)], at: "النسبة", tone: "bad", text: "تحدثت {{talk_share}}٪ من وقت المكالمة، والعميل {{listen_share}}٪." },
      { when: [c("talk_share", "lte", 60)], at: "النسبة", tone: "info", text: "تحدثت {{talk_share}}٪ من وقت المكالمة، والعميل {{listen_share}}٪." },
    ],
    signals: [{ key: "dealClosed", when: [c("outcome", "eq", "success")] }],
  };

  const engine: Port["engine"] = {
    format: "mastery-lab-engine",
    format_version: 1,
    card: {
      key: "sales-discovery",
      runtime_key: "dialogue",
      name: { ar: "مكالمة اكتشاف مبيعات", en: "Sales discovery call" },
      description: {
        ar: "تحضير فرضيات، مكالمة مع مشترٍ متشكك، تسجيل الـCRM وإيميل المتابعة؛ يقيّم الاكتشاف والاعتراضات والإغلاق.",
        en: "Hypotheses, a call with a sceptical buyer, CRM logging and a follow-up email.",
      },
      icon: "phone",
      color: "sky",
      field_category_id: lab.categoryLegacyId ?? null,
      sort_order: 10,
    },
    definition: {
      context: {
        domain: "مبيعات B2B",
        setting: lab.scenario,
        learner_role: lab.role,
        tone: "لهجة سعودية مهنية",
        glossary: ["SPIN", "CRM", "صاحب القرار"],
        system_prompt:
          "You are the buyer in a B2B discovery call. Stay in character, reveal facts only when asked good open questions, push back on generic pitches and competitor bashing.",
        observer_prompt: "Grade discovery, objection handling, rapport, closing, CRM accuracy, the follow-up email and the talk ratio.",
      },
      config: classicConfig({ patience: -3 }, true),
      persona_slots: [{ slot: "buyer", label: { ar: "المشتري", en: "Buyer" }, required: true, default_persona_key: "tarek-al-mansour" }],
      constraints: [
        { key: "call_minutes", label: { ar: "مدة المكالمة", en: "Call length" }, type: "minutes", value: 10, unit: "دقائق", lab_overridable: true, learner_visible: true },
        { key: "budget_cap", label: { ar: "سقف ميزانية العميل", en: "Buyer budget cap" }, type: "money", value: CAP, unit: "USD", lab_overridable: true, learner_visible: false, description: "يُكتشف أثناء المكالمة؛ يُقارن بقيمة الصفقة في الـCRM." },
      ],
      rubric,
      starter_scenario: null,
      notes: "Ported from the bespoke sales lab (content/sales.ts). Parity fixtures: tests/fixtures/labs/dialogue/sales-discovery-call.json.",
    },
  };

  const tarek = salesCall.personas.tarek;
  const personas = [
    persona("tarek-al-mansour", tarek.name, tarek.role, {
      name_en: "Tarek Al-Mansour",
      role_en: "VP Supply Chain, Apex Logistics",
      initials: tarek.initials,
      tone: tarek.tone,
      organization: "أبكس للخدمات اللوجستية",
      personality: "مشغول ومتشكك، تعرّض لتجربة سيئة مع مزود سابق؛ يحترم من يسأل أسئلة ذكية ويرفض العروض العامة.",
      traits: ["متشكك", "عملي", "يحترم الوقت"],
      goals: ["خفض هدر الوقود", "حل جاهز قبل الربع الثالث"],
      speaking_style: "جمل قصيرة، لهجة سعودية، يقاطع عند الإطالة",
      hidden_facts: Object.values(salesFacts),
    }, ["sales", "buyer", "logistics"]),
  ];

  // ---------- parity cases ----------
  const cases: PortCase[] = [];
  const random = rng(20261117);
  for (let index = 0; index < 40; index++) {
    const { state, choices } = walk(salesCall, random, index % 4 === 0 ? 0.85 : index % 4 === 1 ? 0.5 : 0);
    assertSamePlay(`sales #${index}`, scenario, call, state, choices);
    const hyp = sample(random, hypotheses.map((h) => h.id));
    const entry: CrmEntry = {
      stage: random() < 0.15 ? null : pick(random, crmStages.map((s) => s.id)),
      dealValue: random() < 0.15 ? null : pick(random, [0, 25_000, 40_000, 60_000]),
      notes: sample(random, crmNoteOptions.map((o) => o.id)),
      nextStep: random() < 0.1 ? null : pick(random, crmNextSteps.map((s) => s.id)),
    };
    const email = sample(random, emailBlocks.map((b) => b.id));
    const { scorecard, dealClosed } = scoreSales({ call: state, hypotheses: hyp, crm: entry, email });
    cases.push({
      name: `sales-${index}-${state.outcome ?? "open"}`,
      run: {
        stages: {
          prep: { selected: hyp },
          call: { choices },
          crm: { values: { stage: entry.stage, deal_value: entry.dealValue, notes: entry.notes, next_step: entry.nextStep } },
          email: { selected: email },
        },
      },
      expected: expected(scorecard, { dealClosed }),
    });
  }
  return { slug: "sales-discovery-call", engine, personas, scenarioKey: "main", scenario, cases };
}
