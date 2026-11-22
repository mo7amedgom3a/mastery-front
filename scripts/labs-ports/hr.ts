/**
 * Port: HR conflict mediation (Khaled / Sara) → engine `hr-mediation` on the `dialogue` runtime.
 * Mirrors `scoreHr` in `content/hr.ts` term by term.
 */
import {
  hrFacts,
  jointSession,
  khaledSession,
  policy,
  resolutionActions,
  saraSession,
  scoreHr,
  type HrFact,
} from "../../src/features/labs/content/hr";
import { findLab } from "../../src/features/labs/model/catalog";
import type { DialogueScenarioDoc } from "../../src/features/labs/model/dialogue-runtime";
import { assertSamePlay, c, classicConfig, expected, graphStage, meter, persona, rng, sample, T, walk, type Port, type PortCase } from "./common";

export function hrPort(): Port {
  const lab = findLab("hr-conflict-mediation")!;
  const khaled = graphStage(khaledSession, { id: "khaled", notePrefix: "خالد" });
  const sara = graphStage(saraSession, { id: "sara", notePrefix: "سارة" });
  const joint = graphStage(jointSession, { id: "joint", notePrefix: "مشتركة", guards: { breakpoints: [[meter("tension", "gte", 100)]] } });

  const scenario: DialogueScenarioDoc = {
    intro: lab.scenario,
    speakers: { khaled: { slot: "party_a" }, sara: { slot: "party_b" } },
    facts: Object.entries(hrFacts).map(([id, label]) => ({ id, label })),
    stages: [
      {
        id: "policy",
        type: "brief",
        title: "سياسة الشركة",
        body: "اقرأ بنود السياسة قبل الجلسات؛ ستحتاجها في الحياد وخطة الحل.",
        documents: policy.map((clause) => ({ title: clause.title, body: clause.text })),
      },
      khaled,
      sara,
      joint,
      {
        id: "plan",
        type: "select",
        title: "خطة الحل",
        prompt: "اختر الإجراءات التي ستدخل في اتفاق الحل.",
        multiple: true,
        options: resolutionActions.map((action) => ({
          id: action.id,
          label: action.label,
          tags: [...(action.violates ? ["violates"] : []), ...(action.applies ? ["applies"] : []), ...(action.weak ? ["weak"] : [])],
        })),
      },
    ],
  };

  const picked = (id: string) => c("answers.plan", "contains", id);
  const valid = resolutionActions.filter((action) => !action.weak && !action.violates);
  const resolutionTerms = [
    T.tags(["weak"], -15, { stage: "plan" }),
    ...valid.flatMap((action) => {
      const addresses = action.addresses ?? [];
      if (!addresses.length) return [T.if([picked(action.id)], 3)];
      return [
        T.if([picked(action.id)], 15, { any: addresses.map((fact) => c(`fact.${fact}`, "eq", true)) }),
        T.if([picked(action.id), ...addresses.map((fact) => c(`fact.${fact}`, "neq", true))], 3),
      ];
    }),
    ...(Object.keys(hrFacts) as HrFact[]).flatMap((fact) => {
      const covering = valid.filter((action) => action.addresses?.includes(fact));
      return covering.length ? [T.if([c(`fact.${fact}`, "eq", true)], 6, { any: covering.map((action) => picked(action.id)) })] : [];
    }),
    T.if([c("stages.joint.outcome", "eq", "success")], 10),
  ];

  const rubric = {
    run_notes_first: true,
    dimensions: [
      {
        key: "empathy", label: { ar: "الاستماع الفعّال والتعاطف", en: "Active listening" }, skill: "empathy", weight: 2, base: 30,
        terms: [T.tags(["empathy", "listen"], 9), T.tags(["reframe"], 6), T.tags(["dismiss"], -10)],
        praise: "استمعت وأعدت الصياغة، فشعر كل طرف أنه مسموع.",
        tip: "أعد صياغة ما تسمعه («يعني…؟») قبل أن تعلّق أو تقترح.",
      },
      {
        key: "neutrality", label: { ar: "الحياد", en: "Neutrality" }, skill: "communication", weight: 2, base: 100,
        terms: [T.tags(["take-sides"], -22), T.tags(["blame"], -15), T.tags(["neutral"], 5)],
        praise: "حافظت على حيادك أمام الطرفين.",
        tip: "لا تحكم على أحد الطرفين قبل سماع الروايتين، وخاصة أمام الآخر.",
      },
      {
        key: "policy", label: { ar: "الالتزام بالسياسة", en: "Policy" }, skill: "decision", weight: 2, base: 50,
        terms: [T.tags(["policy"], 10), T.tags(["breach"], -30), T.tags(["discipline"], -25), T.tags(["violates"], -25, { stage: "plan" }), T.tags(["applies"], 5, { stage: "plan" })],
        praise: "استخدمت السياسة كمرجع محايد للحل.",
        tip: "احفظ السرية، وافصل التأديب عن الوساطة، واستند للبنود في الحل.",
      },
      {
        key: "deescalation", label: { ar: "خفض التوتر", en: "De-escalation" }, skill: "empathy", weight: 2,
        terms: [T.value("stages.joint.meters.tension", -0.8, 80), T.tags(["de-escalate"], 10), T.if([c("stages.joint.outcome", "eq", "fail")], -30)],
        praise: "أنهيت الجلسة المشتركة بتوتر {{stages.joint.meters.tension}}٪ فقط.",
        tip: "عند التصعيد: أوقف، اتفق على قواعد الحوار، وعد للحقائق.",
      },
      {
        key: "resolution", label: { ar: "جودة خطة الحل", en: "Resolution plan" }, skill: "decision", weight: 2, base: 10,
        terms: resolutionTerms,
        praise: "خطة الحل تعالج جذور الخلاف وتتضمن متابعة.",
        tip: "اختر إجراءً محددًا لكل سبب اكتشفته، وأضف موعد متابعة.",
      },
    ],
    verdicts: [
      { when: [c("stages.joint.outcome", "eq", "success")], text: "انتهت الوساطة باتفاق، والتوتر عند {{stages.joint.meters.tension}}٪." },
      { when: [c("stages.joint.outcome", "eq", "fail")], text: "انهارت الجلسة المشتركة قبل الوصول لاتفاق." },
      { when: [], text: "انتهت الجلسة دون اتفاق مكتوب." },
    ],
    highlights: resolutionActions.flatMap((action) => {
      if (action.violates) {
        const clause = policy.find((item) => item.id === action.violates);
        return [{ when: [picked(action.id)], at: "خطة الحل", tone: "bad", text: `«${action.label}» يخالف بند «${clause?.title}».` }];
      }
      if (action.weak) return [{ when: [picked(action.id)], at: "خطة الحل", tone: "bad", text: action.weak }];
      return [];
    }),
    signals: [{ key: "peaceMade", when: [c("stages.joint.outcome", "eq", "success"), c("stages.joint.meters.tension", "lte", 35)] }],
  };

  const people = khaledSession.personas;
  const engine: Port["engine"] = {
    format: "mastery-lab-engine",
    format_version: 1,
    card: {
      key: "hr-conflict-mediation",
      runtime_key: "dialogue",
      name: { ar: "وساطة في نزاع وظيفي", en: "HR conflict mediation" },
      description: {
        ar: "جلستان فرديتان، جلسة مشتركة، ثم خطة حل؛ يقيّم التعاطف والحياد والالتزام بالسياسة وخفض التوتر.",
        en: "Two private sessions, a joint session and a resolution plan.",
      },
      icon: "users",
      color: "purple",
      field_category_id: lab.categoryLegacyId ?? null,
      sort_order: 20,
    },
    definition: {
      context: {
        domain: "الموارد البشرية",
        setting: lab.scenario,
        learner_role: lab.role,
        tone: "لهجة سعودية مهنية، بيئة شركة تقنية",
        glossary: ["الوساطة", "السرية", "الحياد"],
        system_prompt:
          "You play an employee in a workplace conflict. Open up only when the mediator builds safety, gets defensive when blamed, and never accepts a disciplinary threat inside mediation.",
        observer_prompt: "Grade empathy, neutrality, policy use, de-escalation and the quality of the resolution plan.",
      },
      config: classicConfig(),
      persona_slots: [
        { slot: "party_a", label: { ar: "الطرف الأول", en: "Party A" }, required: true, default_persona_key: "khaled-al-harbi" },
        { slot: "party_b", label: { ar: "الطرف الثاني", en: "Party B" }, required: true, default_persona_key: "sara-al-otaibi" },
      ],
      constraints: [
        { key: "sessions", label: { ar: "عدد الجلسات", en: "Sessions" }, type: "number", value: 3, lab_overridable: false, learner_visible: true },
        { key: "launch_weeks", label: { ar: "الوقت حتى الإطلاق", en: "Time to launch" }, type: "number", value: 4, unit: "أسابيع", lab_overridable: true, learner_visible: true },
      ],
      rubric,
      starter_scenario: null,
      notes: "Ported from the bespoke HR lab (content/hr.ts). Parity fixtures: tests/fixtures/labs/dialogue/hr-conflict-mediation.json.",
    },
  };

  const personas = [
    persona("khaled-al-harbi", people.khaled.name, people.khaled.role, {
      name_en: "Khaled Al-Harbi", role_en: "Senior developer", initials: people.khaled.initials, tone: people.khaled.tone,
      organization: "نما للتقنية",
      personality: "مطوّر متمكّن ومرهق؛ يشعر أن جهده غير مرئي، ودفاعي عند الاتهام.",
      traits: ["مرهق", "حساس للتقدير", "صريح"],
      goals: ["أن يُنسب له عمله", "توزيع عادل للمناوبات"],
      speaking_style: "مباشر، يرفع صوته عند الشعور بالظلم",
      hidden_facts: [hrFacts["khaled-credit"], hrFacts["khaled-overload"]],
    }, ["hr", "employee"]),
    persona("sara-al-otaibi", people.sara.name, people.sara.role, {
      name_en: "Sara Al-Otaibi", role_en: "Product team lead", initials: people.sara.initials, tone: people.sara.tone,
      organization: "نما للتقنية",
      personality: "قائدة منظمة تحت ضغط الإطلاق؛ أُحرجت علنًا ولا تقصد أخذ الفضل.",
      traits: ["منظمة", "تحت ضغط", "تتجنب المواجهة"],
      goals: ["نجاح الإطلاق", "احترام متبادل في القنوات العامة"],
      speaking_style: "هادئ ورسمي، يتحفظ عند الشعور بالهجوم",
      hidden_facts: [hrFacts["sara-attitude"], hrFacts["sara-pressure"]],
    }, ["hr", "manager"]),
  ];

  const cases: PortCase[] = [];
  const random = rng(20261118);
  for (let index = 0; index < 40; index++) {
    const bias = index % 4 === 0 ? 0.85 : index % 4 === 1 ? 0.5 : 0;
    const k = walk(khaledSession, random, bias);
    const s = walk(saraSession, random, bias);
    const j = walk(jointSession, random, bias);
    assertSamePlay(`hr khaled #${index}`, scenario, khaled, k.state, k.choices);
    assertSamePlay(`hr sara #${index}`, scenario, sara, s.state, s.choices);
    assertSamePlay(`hr joint #${index}`, scenario, joint, j.state, j.choices);
    const plan = sample(random, resolutionActions.map((a) => a.id));
    const { scorecard, peaceMade } = scoreHr({ khaled: k.state, sara: s.state, joint: j.state }, plan);
    cases.push({
      name: `hr-${index}-${j.state.outcome ?? "open"}`,
      run: { stages: { khaled: { choices: k.choices }, sara: { choices: s.choices }, joint: { choices: j.choices }, plan: { selected: plan } } },
      expected: expected(scorecard, { peaceMade }),
    });
  }
  return { slug: "hr-conflict-mediation", engine, personas, scenarioKey: "main", scenario, cases };
}
