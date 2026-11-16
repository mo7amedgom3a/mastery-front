/**
 * Crisis war-room lab: a misconfigured storage bucket exposed «نقطة» customer data for 19 days.
 * Six rounds over 72 simulated hours: contain, investigate, notify the regulator inside the PDPL
 * window, talk to customers, staff and the press, then redline the public statement.
 */
import type { DocSpec } from "../components/documents/doc-types";
import { chosenOption, redlinableClauses } from "../components/documents/doc-types";
import type { FeedItem } from "../components/workspace/event-feed";
import { decided, hourOf, type CrisisCard, type CrisisRound, type CrisisState, type StakeMeters } from "../model/crisis-clock";
import { buildScorecard } from "../model/scoring";
import type { Dimension, Highlight, QuizQuestion, Scorecard } from "../model/types";
import { company, people } from "./nuqta/company";

export const NOTIFY_WINDOW = 72;
export const initialMeters: StakeMeters = { customers: 62, regulator: 60, media: 60, staff: 65, cash: 80 };

export const deck: Record<string, CrisisCard> = {
  contain: {
    id: "contain",
    label: "أغلق الوصول العام فورًا وأدر المفاتيح",
    detail: "إيقاف الرابط العام، تدوير مفاتيح الوصول، وحفظ السجلات كما هي.",
    effects: { customers: 6, regulator: 8 },
    tags: ["contain"],
    note: { tone: "good", text: "احتوى التسرب في الساعة الأولى وحفظ الأدلة." },
  },
  observe: {
    id: "observe",
    label: "اترك الرابط مفتوحًا ساعات لنرى من يصل إليه",
    detail: "مراقبة المهاجم قبل الإغلاق.",
    effects: { customers: -12, regulator: -15 },
    tags: ["unsafe"],
    note: { tone: "bad", text: "أبقى بيانات العملاء مكشوفة بحجة المراقبة." },
  },
  "board-legal": {
    id: "board-legal",
    label: "أبلغ رئيس المجلس والمستشار القانوني ومسؤول حماية البيانات",
    detail: "تفعيل خطة الاستجابة وتحديد صاحب القرار.",
    effects: { staff: 6, regulator: 4 },
    tags: ["governance"],
    note: { tone: "good", text: "فعّل خطة الاستجابة وأشرك المجلس والقانوني مبكرًا." },
  },
  forensics: {
    id: "forensics",
    label: "استعن بشركة استجابة للحوادث مرخصة",
    detail: "تحليل جنائي مستقل للنطاق والمدة ومن وصل للبيانات (85 ألف ر.س).",
    effects: { regulator: 8, cash: -10, customers: 3 },
    tags: ["investigate"],
    note: { tone: "good", text: "تحقيق مستقل يثبت النطاق بالأدلة." },
  },
  "delete-logs": {
    id: "delete-logs",
    label: "احذف سجلات الوصول القديمة قبل أن يطلبها أحد",
    detail: "«أقل أدلة، أقل مشاكل».",
    effects: { regulator: -35, staff: -15 },
    tags: ["unethical"],
    note: { tone: "bad", text: "إتلاف أدلة حادثة بيانات: مخالفة جسيمة وفقدان للثقة." },
  },
  holding: {
    id: "holding",
    label: "بيان أولي: نعلم بالحادثة ونحقق ونتواصل مع المتأثرين",
    detail: "اعتراف مبكر دون تفاصيل غير مؤكدة.",
    effects: { media: 10, customers: 6 },
    tags: ["transparent"],
    note: { tone: "good", text: "بيان أولي سريع يسبق الشائعات." },
  },
  "no-comment": {
    id: "no-comment",
    label: "«لا تعليق» حتى ينتهي التحقيق",
    detail: "الصمت الإعلامي.",
    effects: { media: -12, customers: -5 },
    tags: ["silent"],
    note: { tone: "bad", text: "ترك الرواية للآخرين بالصمت." },
  },
  deny: {
    id: "deny",
    label: "ننفي وجود أي تسرب",
    detail: "«أنظمتنا آمنة بالكامل».",
    effects: { media: -20, customers: -15, regulator: -10 },
    tags: ["deny"],
    note: { tone: "bad", text: "نفى حادثة مؤكدة علنًا." },
  },
  "notify-sdaia": {
    id: "notify-sdaia",
    label: "قدّم إشعار تسرب لسدايا عبر المنصة الوطنية",
    detail: "بما هو معروف الآن، مع التزام بتحديث التفاصيل.",
    effects: { regulator: 18 },
    tags: ["notify"],
    note: { tone: "good", text: "أبلغ الجهة التنظيمية داخل المهلة دون انتظار اكتمال التحقيق." },
  },
  "support-script": {
    id: "support-script",
    label: "جهّز فريق الدعم بنص وأسئلة شائعة وتصعيد واضح",
    detail: "كل موظف يعرف ماذا يقول وما لا يقوله.",
    effects: { staff: 10, customers: 5 },
    tags: ["staff"],
    note: { tone: "good", text: "جهّز الخط الأمامي قبل موجة الاتصالات." },
  },
  "notify-customers": {
    id: "notify-customers",
    label: "أبلغ العملاء المتأثرين مباشرة بما حدث وما يفعلونه",
    detail: "رسالة لكل عميل متأثر: البيانات المكشوفة، الخطوات، وقناة للتواصل.",
    effects: { customers: 14, media: 4, regulator: 4 },
    tags: ["notify-customers"],
    note: { tone: "good", text: "أبلغ المتأثرين مباشرة بخطوات عملية." },
  },
  "discount-all": {
    id: "discount-all",
    label: "خصم 50٪ لثلاثة أشهر لكل العملاء",
    detail: "تعويض شامل سريع (يكلف ~190 ألفًا).",
    effects: { customers: 4, cash: -20 },
    tags: ["discount"],
    note: { tone: "info", text: "تعويض مكلف لا يعالج سبب القلق." },
  },
  "account-call": {
    id: "account-call",
    label: "اتصال شخصي من الرئيس التنفيذي بالسلسلة الغاضبة",
    detail: "شرح ما حدث، وما تغير، وعرض مراجعة أمنية مشتركة.",
    effects: { customers: 8 },
    tags: ["personal"],
    note: { tone: "good", text: "تواصل قيادي مباشر مع أكبر عميل متأثر." },
  },
  postmortem: {
    id: "postmortem",
    label: "التزم بمراجعة ما بعد الحادثة دون لوم وإجراءات وقائية بمواعيد",
    detail: "فحص آلي لصلاحيات التخزين، وتدريب، ومراجعة خارجية خلال 30 يومًا.",
    effects: { staff: 8, regulator: 6, customers: 4 },
    tags: ["learn"],
    note: { tone: "good", text: "حوّل الحادثة إلى إجراءات وقائية بمسؤولين ومواعيد." },
  },
  scapegoat: {
    id: "scapegoat",
    label: "أعلن فصل المهندس المسؤول عن الإعداد الخاطئ",
    detail: "إظهار المحاسبة للعموم.",
    effects: { staff: -20, media: -4 },
    tags: ["blame"],
    note: { tone: "bad", text: "حمّل فردًا خطأ نظام وعملية؛ الفريق سيخفي الأخطاء مستقبلًا." },
  },
};

const ev = (id: string, at: number, channel: FeedItem["channel"], from: string, title: string, body: string, severity: FeedItem["severity"] = "info"): FeedItem => ({
  id,
  at: `ساعة ${at}`,
  channel,
  from,
  title,
  body,
  severity,
});

export const rounds: readonly CrisisRound<FeedItem>[] = [
  {
    hour: 0,
    title: "الاكتشاف",
    picks: 1,
    cards: ["contain", "observe", "board-legal"],
    events: () => [
      ev("e0", 0, "system", "باحث أمني (بلاغ مسؤول)", "رابط تخزين عام يكشف ملفات عملاء", "ملف تصدير يحتوي 3,100 سجل: أسماء أصحاب المقاهي، جوالاتهم، عناوين الفروع، وأحجام المشتريات الشهرية. لا بيانات بطاقات.", "critical"),
      ev("e1", 0, "chat", "ريم الشهري", "تأكيد من الفريق التقني", "الرابط فُتح خطأً قبل 19 يومًا أثناء ترحيل البيانات. هو مفتوح الآن.", "critical"),
    ],
  },
  {
    hour: 4,
    title: "التحقيق",
    picks: 2,
    cards: ["board-legal", "forensics", "delete-logs", "notify-sdaia"],
    events: (d) => [
      ...(d.has("contain")
        ? [ev("e2", 4, "system", "الفريق التقني", "أُغلق الرابط", "السجلات تُظهر تنزيلين للملف من عنوان IP غير معروف خلال الأيام الماضية.", "warn")]
        : [ev("e2b", 4, "system", "الفريق التقني", "تنزيل ثالث أثناء الانتظار", "الرابط ما زال مفتوحًا، ونزّل عنوان جديد الملف قبل ساعة.", "critical")]),
      ev("e3", 4, "email", "المستشار القانوني", "مهلة الإشعار", "نظام حماية البيانات الشخصية يطلب إشعار سدايا خلال 72 ساعة من العلم بالحادثة إن كانت قد تضر بأصحاب البيانات. الساعة بدأت.", "warn"),
    ],
  },
  {
    hour: 10,
    title: "وصول الإعلام",
    picks: 1,
    cards: ["holding", "no-comment", "deny"],
    events: () => [
      ev("e4", 10, "social", "@cafe_owner_riyadh", "«رقمي وعنوان فرعي وصلوا لشركة تسويق مزعجة»", "صاحب مقهى ينشر لقطة رسالة احتيالية تذكر اسم فرعه وحجم مشترياته. 1.2 ألف إعادة نشر.", "warn"),
      ev("e5", 10, "email", people.journalist.name, "طلب تعليق قبل النشر", "أكتب تقريرًا عن تسرب بيانات عملاء «نقطة». هل تؤكدون؟ أنشر خلال 4 ساعات.", "warn"),
    ],
  },
  {
    hour: 20,
    title: "الضغط الداخلي",
    picks: 2,
    cards: ["notify-sdaia", "support-script", "notify-customers", "scapegoat"],
    events: (d) => [
      ...(d.has("deny")
        ? [ev("e6b", 20, "media", "تقنية اليوم", "«نقطة تنفي... والباحث ينشر الدليل»", "الباحث نشر لقطة من الملف بعد النفي. التغطية تتحول إلى المصداقية.", "critical")]
        : d.has("holding")
          ? [ev("e6", 20, "media", "تقنية اليوم", "«نقطة تقر بحادثة بيانات وتتحقق»", "التقرير ينقل البيان الأولي ويصفه بالسريع.", "info")]
          : [ev("e6c", 20, "media", "تقنية اليوم", "«صمت نقطة بعد تسرب بيانات العملاء»", "التقرير يعتمد على رواية العملاء فقط.", "warn")]),
      ev("e7", 20, "chat", "فريق الدعم", "120 اتصالًا في ساعتين", "العملاء يسألون: ما الذي تسرب؟ هل نغير كلمات المرور؟ لا نعرف ماذا نقول.", "warn"),
    ],
  },
  {
    hour: 40,
    title: "العملاء الكبار",
    picks: 2,
    cards: ["notify-customers", "account-call", "discount-all", "notify-sdaia", "support-script"],
    events: (d) => [
      ev("e8", 40, "call", "سلسلة «بن الديرة» (24 فرعًا)", "تهديد بإنهاء العقد", "مدير المشتريات: «عرفنا من تويتر قبلكم. إن لم نفهم ما حدث خلال يوم سننهي العقد».", "critical"),
      ...(d.has("notify-sdaia")
        ? [ev("e9", 40, "regulator", "سدايا", "استلام الإشعار", "تم استلام إشعار الحادثة. يرجى تزويدنا بتقرير التحقيق والإجراءات خلال 5 أيام عمل.", "info")]
        : [ev("e9b", 40, "regulator", "سدايا", "استفسار عن حادثة منشورة", "رصدنا تقارير عن تسرب بيانات لدى منشأتكم. لم يصلنا إشعار. يرجى الإفادة.", "critical")]),
    ],
  },
  {
    hour: 70,
    title: "الإغلاق",
    picks: 2,
    cards: ["postmortem", "scapegoat", "notify-sdaia", "notify-customers"],
    events: (d) => [
      ev("e10", 70, "email", "شركة الاستجابة للحوادث", d.has("forensics") ? "التقرير الأولي" : "لا يوجد تحقيق مستقل", d.has("forensics") ? "النطاق مؤكد: 3,100 سجل، تنزيلان، لا مؤشر على بيانات دفع أو كلمات مرور. السبب: صلاحية عامة أثناء الترحيل." : "بلا تحقيق مستقل لا يمكن تأكيد النطاق للعملاء أو الجهة التنظيمية.", d.has("forensics") ? "info" : "warn"),
      ev("e11", 70, "chat", "المهندس المسؤول عن الترحيل", "«أنا آسف، كان خطئي»", "الفريق ينتظر: هل نتعلم أم نعاقب؟", "info"),
    ],
  },
];

export function crisisNotifyHour(state: CrisisState): number | null {
  return hourOf(state, "notify-sdaia");
}

// ---------- press statement ----------

export function statementDoc(): DocSpec {
  return {
    title: "بيان صحفي",
    subtitle: "حادثة الوصول غير المصرح إلى بيانات العملاء",
    ref: "NQT-PR-2026-11",
    date: "نوفمبر 2026",
    issuer: { name: company.name, tagline: "الاتصال المؤسسي", color: "coral" },
    pages: [
      [
        {
          blocks: [
            {
              kind: "clause",
              id: "what",
              number: "1",
              title: "ما حدث",
              text: "تعرضنا لهجوم إلكتروني متقدم من جهة مجهولة.",
              issue: "لم يكن هجومًا: الرابط فُتح خطأً أثناء ترحيل البيانات. الوصف غير الدقيق ينكشف سريعًا.",
              options: [
                { id: "keep", label: "«هجوم متقدم»", text: "", acceptance: -10, margin: 0, note: "وصف الخطأ الداخلي بأنه هجوم متقدم يضلل الجمهور." },
                {
                  id: "accurate",
                  label: "وصف دقيق للسبب",
                  text: "في 3 نوفمبر أبلغنا باحث أمني أن ملفًا من بيانات العملاء كان متاحًا عبر رابط تخزين عام بسبب خطأ في الإعداد أثناء ترحيل البيانات. أغلقنا الرابط خلال ساعة من البلاغ.",
                  acceptance: 15,
                  margin: 10,
                  balanced: true,
                },
              ],
            },
            {
              kind: "clause",
              id: "data",
              number: "2",
              title: "البيانات المتأثرة",
              text: "لم تتأثر أي بيانات حساسة.",
              issue: "الأسماء والجوالات والعناوين بيانات شخصية؛ «لا بيانات حساسة» تقلل من الأثر.",
              options: [
                { id: "keep", label: "«لا بيانات حساسة»", text: "", acceptance: -12, margin: 0, note: "التقليل من أثر بيانات شخصية مكشوفة." },
                {
                  id: "precise",
                  label: "قائمة دقيقة بما تأثر وما لم يتأثر",
                  text: "شمل الملف لـ 3,100 عميل: الاسم، رقم الجوال، عنوان الفرع، وحجم المشتريات الشهرية. لم يتضمن بيانات بطاقات أو كلمات مرور.",
                  acceptance: 15,
                  margin: 10,
                  balanced: true,
                },
              ],
            },
            {
              kind: "clause",
              id: "actions",
              number: "3",
              title: "ما قمنا به",
              text: "نعمل على معالجة الأمر.",
              issue: "عبارة عامة لا تبني الثقة.",
              options: [
                { id: "keep", label: "عبارة عامة", text: "", acceptance: -5, margin: 0 },
                {
                  id: "concrete",
                  label: "إجراءات محددة",
                  text: "أغلقنا الوصول وأدرنا المفاتيح، وكلفنا شركة استجابة مستقلة بالتحقيق، وأبلغنا الهيئة السعودية للبيانات والذكاء الاصطناعي (سدايا)، وتواصلنا مع كل عميل متأثر.",
                  acceptance: 15,
                  margin: 10,
                  balanced: true,
                },
              ],
            },
            {
              kind: "clause",
              id: "advice",
              number: "4",
              title: "ما ننصح به العملاء",
              text: "لا يلزم أي إجراء.",
              issue: "العملاء معرضون لرسائل احتيال تستخدم بياناتهم.",
              options: [
                { id: "keep", label: "«لا يلزم أي إجراء»", text: "", acceptance: -8, margin: 0, note: "لم ينبه العملاء لخطر الاحتيال." },
                {
                  id: "phishing",
                  label: "تحذير عملي من الاحتيال",
                  text: "ننصح بالحذر من أي رسالة تطلب رمز تحقق أو دفعًا باسم «نقطة»؛ نحن لا نطلب الرموز أبدًا. للاستفسار: 920000000 أو privacy@nuqta.sa.",
                  acceptance: 12,
                  margin: 10,
                  balanced: true,
                },
              ],
            },
            {
              kind: "clause",
              id: "apology",
              number: "5",
              title: "الاعتذار",
              text: "نأسف إن شعر أي عميل بالإزعاج، وقد كان الخطأ من مزود خدمة التخزين.",
              issue: "اعتذار مشروط مع لوم المزود، بينما الإعداد كان مسؤوليتنا.",
              options: [
                { id: "keep", label: "اعتذار مشروط ولوم المزود", text: "", acceptance: -12, margin: 0, note: "اعتذار مشروط يلقي اللوم على المزود." },
                {
                  id: "own",
                  label: "اعتذار واضح وتحمل المسؤولية",
                  text: "نعتذر لعملائنا. حماية بياناتكم مسؤوليتنا، وقد قصرنا فيها. سننشر نتائج المراجعة والإجراءات الوقائية خلال 30 يومًا.",
                  acceptance: 15,
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
              parties: [
                { role: "الرئيس التنفيذي", name: people.faisal.name, signed: false },
                { role: "مسؤول حماية البيانات", name: "أنت", signed: false },
              ],
            },
          ],
        },
      ],
    ],
    footer: `${company.name} · للنشر`,
  };
}

export function statementScore(redlines: Readonly<Record<string, string>>): number {
  const clauses = redlinableClauses(statementDoc());
  return Math.round((clauses.filter((c) => chosenOption(c, redlines)?.balanced).length / clauses.length) * 100);
}

// ---------- quizzes ----------

export const crisisPreQuiz: readonly QuizQuestion[] = [
  {
    prompt: "اكتشفت أن بيانات عملاء مكشوفة الآن. أول قرار؟",
    options: [
      { label: "أوقف الكشف فورًا وأحفظ الأدلة", points: 2, style: "assertive" },
      { label: "أنتظر حتى نفهم كل شيء", points: 0, style: "avoidant" },
      { label: "أصدر بيانًا قبل أي شيء", points: 1, style: "collaborative" },
    ],
    explain: "الاحتواء أولًا: كل دقيقة مفتوحة تزيد الضرر.",
  },
  {
    prompt: "صحفية تطلب تعليقًا وأنت لا تعرف كل التفاصيل.",
    options: [
      { label: "بيان أولي: نعلم، نحقق، وسنحدّث", points: 2, style: "collaborative" },
      { label: "لا تعليق", points: 0, style: "avoidant" },
      { label: "ننفي حتى نتأكد", points: 0, style: "assertive" },
    ],
    explain: "الاعتراف بما تعرفه يسبق الشائعة دون أن يلزمك بما لا تعرفه.",
  },
  {
    prompt: "متى تُبلغ الجهة التنظيمية؟",
    options: [
      { label: "داخل المهلة النظامية بما هو معروف، ثم أحدّث", points: 2, style: "analytical" },
      { label: "بعد انتهاء التحقيق كاملًا", points: 0, style: "avoidant" },
      { label: "فقط إن سألت", points: 0, style: "avoidant" },
    ],
    explain: "الإشعار لا ينتظر اكتمال التحقيق؛ التحديثات تأتي لاحقًا.",
  },
];

export const crisisPostQuiz: readonly QuizQuestion[] = [
  {
    prompt: "مهلة إشعار سدايا عن تسرب قد يضر بأصحاب البيانات:",
    options: [
      { label: "72 ساعة من العلم بالحادثة", points: 2 },
      { label: "30 يومًا", points: 0 },
      { label: "لا توجد مهلة", points: 0 },
    ],
    explain: "وفق اللائحة الحالية؛ وهناك مسودة تعديل تقترح إلغاء شرط الضرر.",
  },
  {
    prompt: "مراجعة ما بعد الحادثة «دون لوم» تعني:",
    options: [
      { label: "نبحث في النظام والعملية التي سمحت بالخطأ، لا عن كبش فداء", points: 2 },
      { label: "لا أحد يُحاسب أبدًا", points: 0 },
      { label: "نخفي الأخطاء عن الإدارة", points: 0 },
    ],
    explain: "معاقبة الفرد تجعل الفريق يخفي الأخطاء القادمة.",
  },
  {
    prompt: "في البيان العام عن بيانات شخصية مكشوفة:",
    options: [
      { label: "ما حدث بدقة، ما تأثر، ما فعلناه، وما يفعله العميل", points: 2 },
      { label: "عبارات مطمئنة عامة", points: 0 },
      { label: "التركيز على قوة أنظمتنا", points: 0 },
    ],
    explain: "الدقة والخطوات العملية تبني الثقة؛ التطمين العام يفقدها.",
  },
];

// ---------- run + rubric ----------

export type CrisisRun = { state: CrisisState; statement: Record<string, string> };

export function scoreCrisis(run: CrisisRun): { scorecard: Scorecard; crisisCommander: boolean } {
  const { state } = run;
  const highlights: Highlight[] = [];
  const set = decided(state);
  for (const d of state.decisions) {
    const card = deck[d.card];
    if (card?.note) highlights.push({ at: `ساعة ${d.hour}`, tone: card.note.tone, text: card.note.text });
  }

  const containHour = hourOf(state, "contain");
  const containment = containHour === 0 ? 100 : containHour !== null ? 50 : 0;
  if (containHour === null) highlights.push({ at: "الاحتواء", tone: "bad", text: "لم يُغلق الوصول العام صراحة: البيانات بقيت مكشوفة." });

  const notifyHour = crisisNotifyHour(state);
  const regulatory = notifyHour === null ? 0 : notifyHour <= 20 ? 100 : notifyHour <= NOTIFY_WINDOW ? 70 : 20;
  if (notifyHour === null) highlights.push({ at: "سدايا", tone: "bad", text: "لم يُقدَّم إشعار التسرب، والجهة التنظيمية علمت من الإعلام." });
  else if (notifyHour > 20) highlights.push({ at: "سدايا", tone: "info", text: `الإشعار في الساعة ${notifyHour}: داخل المهلة لكن متأخر عن الإعلام.` });

  const unethical = ["delete-logs", "deny", "scapegoat", "observe"].filter((id) => set.has(id));
  const ethics = 100 - unethical.length * 35;

  const comms =
    (set.has("holding") ? 35 : 0) + (set.has("notify-customers") ? 35 : 0) + (set.has("support-script") ? 15 : 0) + (set.has("account-call") ? 15 : 0) - (set.has("deny") ? 40 : 0) - (set.has("no-comment") ? 15 : 0);

  const m = state.meters;
  const trust = (m.customers + m.regulator + m.media + m.staff + m.cash) / 5;
  const statement = statementScore(run.statement);
  for (const clause of redlinableClauses(statementDoc())) {
    const option = chosenOption(clause, run.statement);
    if (!option?.balanced && option?.note) highlights.push({ at: `البيان · ${clause.title}`, tone: "bad", text: option.note });
  }

  const dimensions: Dimension[] = [
    { key: "containment", label: "سرعة الاحتواء", score: containment, weight: 1.5, skill: "execution", praise: "أغلقت الكشف في الساعة الأولى وحفظت الأدلة.", tip: "أول قرار دائمًا: أوقف النزيف واحفظ الأدلة، ثم حقق." },
    { key: "regulatory", label: "الامتثال التنظيمي", score: regulatory, weight: 2, skill: "decision", praise: "أبلغت الجهة التنظيمية داخل المهلة وبادرت قبل أن تسأل.", tip: "لا تنتظر اكتمال التحقيق: أبلغ بما تعرفه داخل المهلة ثم حدّث." },
    { key: "ethics", label: "النزاهة تحت الضغط", score: ethics, weight: 2, skill: "decision", praise: "لا نفي، ولا إتلاف أدلة، ولا كبش فداء.", tip: "النفي وإتلاف الأدلة ولوم الأفراد تحوّل حادثة تقنية إلى أزمة ثقة." },
    { key: "comms", label: "التواصل مع أصحاب المصلحة", score: comms, weight: 1.5, skill: "communication", praise: "بيان مبكر، إبلاغ مباشر للمتأثرين، وفريق دعم جاهز.", tip: "رتّب الجمهور: المتأثرون ← الفريق ← العملاء الكبار ← الإعلام، ولكل رسالة واضحة." },
    { key: "trust", label: "ثقة أصحاب المصلحة", score: trust, weight: 1, skill: "empathy", praise: "خرجت من الأزمة وثقة الأطراف متماسكة.", tip: "كل قرار يحرك أكثر من طرف؛ وازن بين العملاء والجهة التنظيمية والفريق والنقد." },
    { key: "statement", label: "جودة البيان العام", score: statement, weight: 1.5, skill: "communication", praise: "بيان دقيق: ما حدث، ما تأثر، ما فعلناه، وما يفعله العميل، واعتذار صريح.", tip: "تجنب التهويل («هجوم متقدم») والتقليل («لا بيانات حساسة») والاعتذار المشروط." },
  ];

  const crisisCommander = containHour === 0 && notifyHour !== null && notifyHour <= NOTIFY_WINDOW && unethical.length === 0 && statement >= 80;
  const verdict = crisisCommander
    ? `احتواء في الساعة الأولى، إشعار سدايا في الساعة ${notifyHour}، وبيان دقيق.`
    : notifyHour === null
      ? "الحادثة احتُويت جزئيًا، لكن الجهة التنظيمية لم تُبلغ."
      : unethical.length
        ? "قرارات غير نزيهة تحت الضغط حولت حادثة تقنية إلى أزمة ثقة."
        : "تعاملت مع الأزمة، مع فرص لتسريع الاحتواء وتحسين الرسائل.";
  return { scorecard: buildScorecard({ dimensions, highlights, verdict }), crisisCommander };
}

