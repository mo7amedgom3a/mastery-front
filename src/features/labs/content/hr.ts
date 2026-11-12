/**
 * HR Conflict Mediation: Khaled (senior developer) and Sara (team lead) at «نما للتقنية».
 * Two private sessions, one joint session, a resolution plan and the observer rubric.
 */
import { tagCount, type DialogueGraph, type DialogueState } from "../model/dialogue";
import { buildScorecard, clock } from "../model/scoring";
import type { Dimension, Highlight, QuizQuestion, Scorecard } from "../model/types";

export type HrFact = "khaled-credit" | "khaled-overload" | "sara-attitude" | "sara-pressure" | "shared-goal";

export const hrFacts: Record<HrFact, string> = {
  "khaled-credit": "خالد يشعر أن عمله عُرض للإدارة دون ذكر اسمه",
  "khaled-overload": "خالد يغطي المناوبة الليلية وحده منذ ستة أسابيع",
  "sara-attitude": "سارة أُحرجت من رسالة خالد في القناة العامة",
  "sara-pressure": "سارة جهّزت العرض تحت ضغط وقت، دون نية لأخذ الفضل",
  "shared-goal": "الطرفان يريدان نجاح الإطلاق بعد شهر",
};

export const policy: readonly { id: string; title: string; text: string }[] = [
  { id: "p1", title: "الاحترام المتبادل", text: "تُناقش الخلافات بشكل خاص أولًا، لا في القنوات العامة." },
  { id: "p2", title: "نسب العمل", text: "تُذكر مساهمات أعضاء الفريق بالاسم في العروض المقدمة للإدارة." },
  { id: "p3", title: "عبء العمل", text: "لا تتجاوز مناوبات الطوارئ أسبوعين متتاليين لنفس الموظف." },
  { id: "p4", title: "السرية", text: "ما يقال في الجلسات الفردية لا يُنقل للطرف الآخر دون إذن صاحبه." },
  { id: "p5", title: "فصل المسارات", text: "لا تُتخذ إجراءات تأديبية في جلسات الوساطة؛ لها مسار مستقل." },
];

const personas = {
  khaled: { name: "خالد الحربي", role: "مطوّر أول", initials: "خح", tone: "purple" },
  sara: { name: "سارة العتيبي", role: "قائدة فريق المنتج", initials: "سع", tone: "teal" },
} as const satisfies DialogueGraph["personas"];

export const khaledSession: DialogueGraph = {
  id: "hr-khaled",
  title: "جلسة فردية مع خالد",
  start: "k-start",
  personas,
  initial: { trust: 30, patience: 100, tension: 65 },
  visibleMeters: ["trust", "tension"],
  nodes: {
    "k-start": {
      id: "k-start",
      speaker: "khaled",
      line: "بصراحة ما كنت أبي أجي. حاس إن الموضوع ما له فايدة.",
      choices: [
        {
          id: "k-safe",
          label: "أقدّر إنك جيت رغم كذا. هذي الجلسة لك، وكل اللي تقوله يبقى بيننا إلا إذا سمحت. وش اللي صاير من وجهة نظرك؟",
          tags: ["empathy", "policy", "open"],
          effects: { trust: 15, tension: -10 },
          next: "k-credit",
          note: { tone: "good", text: "بنى أمانًا نفسيًا ووضّح السرية من البداية." },
        },
        {
          id: "k-accuse",
          label: "وصلنا إنك رديت على سارة بأسلوب غير لائق في القناة العامة. ليش؟",
          tags: ["blame"],
          effects: { trust: -15, tension: 15 },
          next: "k-defensive",
          note: { tone: "bad", text: "بدأ بالاتهام، فدخل خالد في موقف دفاعي." },
        },
        {
          id: "k-rush",
          label: "خلنا نخلص بسرعة، وش المشكلة؟",
          tags: ["dismiss"],
          effects: { trust: -5, tension: 5 },
          next: "k-credit",
        },
      ],
    },
    "k-defensive": {
      id: "k-defensive",
      speaker: "khaled",
      line: "يعني جايبيني عشان تحاسبوني؟ طيب وش عن اللي سوته هي؟",
      choices: [
        {
          id: "k-reset",
          label: "ما جيت أحاسب أحد، أبي أفهم الصورة كاملة. وش اللي سوته وضايقك؟",
          tags: ["neutral", "empathy", "recovery"],
          effects: { trust: 10, tension: -10 },
          next: "k-credit",
        },
        {
          id: "k-policy-hammer",
          label: "سلوكك في القناة العامة مخالف للسياسة، وهذا اللي يهمني الحين.",
          tags: ["blame", "discipline"],
          effects: { trust: -15, tension: 20 },
          next: "k-shutdown",
          note: { tone: "bad", text: "حوّل جلسة الوساطة إلى مساءلة تأديبية (مخالف للبند 5)." },
        },
      ],
    },
    "k-shutdown": {
      id: "k-shutdown",
      speaker: "khaled",
      line: "خلاص، ما عندي شي أضيفه.",
      end: "fail",
    },
    "k-credit": {
      id: "k-credit",
      speaker: "khaled",
      line: "اشتغلت شهرين على ميزة التتبع، وفي اجتماع الإدارة عرضتها سارة كأنها شغلها. ولا ذكرت اسمي.",
      reveals: ["khaled-credit"],
      choices: [
        {
          id: "k-paraphrase",
          label: "يعني جهدك ما انشاف قدام الإدارة، وهذا شي يضايق أي أحد. فهمتك صح؟",
          tags: ["listen", "empathy"],
          effects: { trust: 15, tension: -15 },
          next: "k-overload",
          note: { tone: "good", text: "إعادة صياغة (Paraphrasing) أشعرت خالد أنه مسموع." },
        },
        {
          id: "k-defend-sara",
          label: "يمكن ما قصدت، الإدارة تعرف إن الفريق كله اشتغل.",
          tags: ["take-sides", "dismiss"],
          effects: { trust: -10, tension: 10 },
          next: "k-overload-cold",
          note: { tone: "bad", text: "دافع عن سارة قبل أن يسمع القصة كاملة." },
        },
      ],
    },
    "k-overload": {
      id: "k-overload",
      speaker: "khaled",
      line: "بالضبط. وفوق هذا، صار لي ست أسابيع ماسك المناوبة الليلية لحالي، محد سأل عني.",
      reveals: ["khaled-overload"],
      choices: [
        {
          id: "k-policy-care",
          label: "ست أسابيع كثيرة، والسياسة تحدد أسبوعين كحد أقصى. هذا لازم ينحل بغض النظر عن الخلاف.",
          tags: ["policy", "empathy"],
          effects: { trust: 10, tension: -10 },
          next: "k-ready",
          note: { tone: "good", text: "ربط عبء العمل بالسياسة (البند 3) وفصله عن الخلاف الشخصي." },
        },
        {
          id: "k-everyone",
          label: "الكل مضغوط هالفترة بسبب الإطلاق.",
          tags: ["dismiss"],
          effects: { trust: -5, tension: 10 },
          next: "k-ready",
        },
      ],
    },
    "k-overload-cold": {
      id: "k-overload-cold",
      speaker: "khaled",
      line: "إيه أكيد… (يسكت قليلًا) وعلى فكرة، أنا ماسك المناوبات لحالي من ست أسابيع.",
      reveals: ["khaled-overload"],
      choices: [
        {
          id: "k-cold-policy",
          label: "هذا مهم، والسياسة تحدد أسبوعين كحد أقصى. بنعالجه.",
          tags: ["policy"],
          effects: { trust: 10, tension: -5 },
          next: "k-ready",
        },
        {
          id: "k-cold-dismiss",
          label: "طيب، نرجع لموضوع الرسالة.",
          tags: ["dismiss"],
          effects: { trust: -10, tension: 10 },
          next: "k-ready",
        },
      ],
    },
    "k-ready": {
      id: "k-ready",
      speaker: "khaled",
      line: "طيب… لو بنجلس مع سارة، وش الضمان إن الكلام بيتغيّر؟",
      choices: [
        {
          id: "k-agreement",
          label: "الهدف نطلع باتفاق واضح ومكتوب ونتابع بعد أسبوعين. وأنت تقرر وش تحب تطرحه بنفسك من كلامنا اليوم.",
          tags: ["solution", "policy"],
          effects: { trust: 10, tension: -10 },
          next: "k-end-good",
        },
        {
          id: "k-promise",
          label: "أوعدك إن سارة بتعتذر لك قدام الفريق.",
          tags: ["overpromise", "take-sides"],
          effects: { trust: 5 },
          next: "k-end-ok",
          note: { tone: "bad", text: "وعد بنتيجة لا يملكها الوسيط، وانحاز مسبقًا." },
        },
      ],
    },
    "k-end-good": { id: "k-end-good", speaker: "khaled", line: "تمام، مستعد أجلس معها.", end: "success" },
    "k-end-ok": { id: "k-end-ok", speaker: "khaled", line: "نشوف…", end: "neutral" },
  },
};

export const saraSession: DialogueGraph = {
  id: "hr-sara",
  title: "جلسة فردية مع سارة",
  start: "s-start",
  personas,
  initial: { trust: 40, patience: 100, tension: 60 },
  visibleMeters: ["trust", "tension"],
  nodes: {
    "s-start": {
      id: "s-start",
      speaker: "sara",
      line: "أتمنى ما يكون هذا بسبب رسالة خالد في القناة. أنا اللي المفروض أشتكي!",
      choices: [
        {
          id: "s-open",
          label: "واضح إن الرسالة ضايقتك. خذي راحتك، وش اللي صار؟",
          tags: ["empathy", "listen"],
          effects: { trust: 10, tension: -10 },
          next: "s-attitude",
        },
        {
          id: "s-leak",
          label: "خالد عنده شكوى جدية إنك عرضتي شغله باسمك.",
          tags: ["breach", "take-sides"],
          effects: { trust: -15, tension: 15 },
          next: "s-defensive",
          note: { tone: "bad", text: "نقل كلام خالد من الجلسة الفردية دون إذنه (مخالف للبند 4)." },
        },
      ],
    },
    "s-defensive": {
      id: "s-defensive",
      speaker: "sara",
      line: "يعني صار هو الضحية؟ أنا اللي شايلة الفريق كله!",
      choices: [
        {
          id: "s-neutral",
          label: "ما أحد ضحية هنا، وأسمع الطرفين بنفس الطريقة. احكي لي من جهتك.",
          tags: ["neutral", "empathy", "recovery"],
          effects: { trust: 10, tension: -10 },
          next: "s-attitude",
        },
        {
          id: "s-blame",
          label: "لازم تعترفين إنك غلطتي.",
          tags: ["blame", "take-sides"],
          effects: { trust: -20, tension: 20 },
          next: "s-shutdown",
        },
      ],
    },
    "s-shutdown": { id: "s-shutdown", speaker: "sara", line: "إذا كذا، الجلسة انتهت عندي.", end: "fail" },
    "s-attitude": {
      id: "s-attitude",
      speaker: "sara",
      line: "كتب في القناة العامة: «كالعادة الشغل علينا والكلام لغيرنا». قدام الفريق كله!",
      reveals: ["sara-attitude"],
      choices: [
        {
          id: "s-context",
          label: "الموقف كان محرج لك قدام الفريق. وش كان يصير قبلها؟",
          tags: ["listen", "empathy", "open"],
          effects: { trust: 10, tension: -10 },
          next: "s-pressure",
          note: { tone: "good", text: "اعترف بالإحراج ثم سأل عن السياق بدل الحكم." },
        },
        {
          id: "s-punish",
          label: "ردّه مو مقبول، بنتخذ إجراء معه.",
          tags: ["take-sides", "discipline"],
          effects: { trust: 5, tension: 5 },
          next: "s-pressure",
          note: { tone: "bad", text: "وعد بإجراء تأديبي داخل الوساطة وانحاز لطرف." },
        },
      ],
    },
    "s-pressure": {
      id: "s-pressure",
      speaker: "sara",
      line: "المدير طلب العرض قبل الاجتماع بساعة. جمعت الشرائح بسرعة وما انتبهت إني ما ذكرت الأسماء… ما كان قصدي.",
      reveals: ["sara-pressure"],
      choices: [
        {
          id: "s-reframe",
          label: "يعني كان ضغط وقت، مو نية. تتوقعين خالد يعرف هذا؟",
          tags: ["reframe", "listen"],
          effects: { trust: 10, tension: -10 },
          next: "s-goal",
          note: { tone: "good", text: "أعاد التأطير: من «نية سيئة» إلى «ضغط وقت»." },
        },
        {
          id: "s-whatever",
          label: "عادي، المهم إن العرض نجح.",
          tags: ["dismiss"],
          effects: { tension: 5 },
          next: "s-goal",
        },
      ],
    },
    "s-goal": {
      id: "s-goal",
      speaker: "sara",
      line: "أكيد لا… وأنا أصلًا أحتاج خالد، هو أقوى مطوّر عندي والإطلاق بعد شهر.",
      reveals: ["shared-goal"],
      choices: [
        {
          id: "s-joint",
          label: "هذا هدف مشترك بينكم. مستعدة نجلس الثلاثة ونطلع باتفاق واضح؟",
          tags: ["solution"],
          effects: { trust: 10, tension: -10 },
          next: "s-end-good",
        },
        {
          id: "s-messenger",
          label: "خلاص، أنا بكلمه وأقوله إنك ما قصدتي.",
          tags: ["avoid"],
          next: "s-end-ok",
          note: { tone: "info", text: "اختار دور الرسول بدل جمع الطرفين." },
        },
      ],
    },
    "s-end-good": { id: "s-end-good", speaker: "sara", line: "مستعدة. خلنا نخلص منها.", end: "success" },
    "s-end-ok": { id: "s-end-ok", speaker: "sara", line: "طيب، مثل ما تشوف.", end: "neutral" },
  },
};

export const jointSession: DialogueGraph = {
  id: "hr-joint",
  title: "الجلسة المشتركة",
  start: "j-start",
  personas,
  initial: { trust: 45, patience: 100, tension: 70 },
  visibleMeters: ["tension"],
  breakpoints: [{ when: (s) => s.meters.tension >= 100, to: "j-walkout" }],
  nodes: {
    "j-start": {
      id: "j-start",
      speaker: "khaled",
      line: "قبل لا نبدأ، أبي أعرف ليش ما انذكر اسمي في العرض.",
      next: "j-snap",
    },
    "j-snap": {
      id: "j-snap",
      speaker: "sara",
      line: "وأنا أبي أعرف ليش تكتب عني في القناة العامة!",
      effects: { tension: 10 },
      choices: [
        {
          id: "j-ground-rules",
          label: "واضح إن عند كل واحد فيكم شي مهم يبيه ينسمع. خلونا نتفق على قاعدة: كل واحد يتكلم بدون مقاطعة، ونبدأ بالحقائق.",
          tags: ["de-escalate", "neutral"],
          effects: { tension: -20, trust: 10 },
          next: "j-facts",
          note: { tone: "good", text: "قواعد أساسية للحوار هدّأت الجلسة من أول دقيقة." },
        },
        {
          id: "j-side-khaled",
          label: "سارة، خالد معه حق، كان لازم تذكرين اسمه.",
          tags: ["take-sides"],
          effects: { tension: 20 },
          next: "j-escalate",
          note: { tone: "bad", text: "انحاز علنًا لأحد الطرفين في أول الجلسة." },
        },
        {
          id: "j-side-sara",
          label: "خالد، رسالتك في القناة مخالفة للسياسة.",
          tags: ["take-sides", "blame"],
          effects: { tension: 20 },
          next: "j-escalate",
          note: { tone: "bad", text: "بدأ بلوم خالد أمام سارة." },
        },
      ],
    },
    "j-escalate": {
      id: "j-escalate",
      speaker: "khaled",
      line: "شفت؟ نفس الشي كل مرة.",
      next: "j-escalate-2",
    },
    "j-escalate-2": {
      id: "j-escalate-2",
      speaker: "sara",
      line: "ما راح أجلس أسمع هذا.",
      choices: [
        {
          id: "j-repair",
          label: "أعتذر، صياغتي ما كانت عادلة. خلونا نرجع للحقائق بدون لوم: وش صار بالضبط في اجتماع الإدارة؟",
          tags: ["de-escalate", "neutral", "recovery"],
          effects: { tension: -20 },
          next: "j-facts",
          note: { tone: "good", text: "اعترف بخطئه كوسيط وأعاد الجلسة للحقائق." },
        },
        {
          id: "j-threat",
          label: "إذا ما تقدرون تتفاهمون، بنرفع الموضوع للمدير.",
          tags: ["threat"],
          effects: { tension: 25 },
          next: "j-end-fail",
        },
      ],
    },
    "j-facts": {
      id: "j-facts",
      speaker: "sara",
      line: "العرض انطلب مني قبل ساعة. ما كان عندي وقت أراجع الشرائح، وهذا خطأ مني إني ما ذكرت خالد.",
      reveals: ["sara-pressure"],
      next: "j-khaled-soft",
    },
    "j-khaled-soft": {
      id: "j-khaled-soft",
      speaker: "khaled",
      line: "ما كنت أعرف إنه انطلب بهالسرعة… بس المشكلة مو بس العرض. أنا ماسك المناوبة لحالي من ست أسابيع.",
      reveals: ["khaled-overload"],
      choices: [
        {
          id: "j-split-issues",
          label: "شكرًا إنكم وضحتوا. خلونا نفصل موضوعين: نسب العمل، وتوزيع المناوبات. نبدأ بالمناوبات لأن فيها سياسة واضحة: أسبوعين كحد أقصى.",
          tags: ["policy", "reframe"],
          effects: { tension: -15 },
          next: "j-oncall",
          note: { tone: "good", text: "فصل القضايا وبدأ بالأسهل المحكوم بسياسة واضحة." },
        },
        {
          id: "j-move-on",
          label: "خلونا ننسى اللي فات ونركز على الإطلاق.",
          tags: ["dismiss"],
          effects: { tension: 15 },
          next: "j-oncall",
          note: { tone: "bad", text: "تجاوز مشكلة عبء العمل بدل حلها." },
        },
      ],
    },
    "j-oncall": {
      id: "j-oncall",
      speaker: "sara",
      line: "ما كنت منتبهة إنها صارت ست أسابيع. أقدر أسوي جدول دوري من الأسبوع الجاي.",
      choices: [
        {
          id: "j-private-first",
          label: "ممتاز. وبخصوص القناة العامة، وش رأيكم نتفق إن أي خلاف ينطرح بشكل خاص أول؟",
          tags: ["policy", "solution"],
          effects: { tension: -10 },
          next: "j-channel",
        },
        {
          id: "j-force-apology",
          label: "خالد، لازم تعتذر عن رسالتك قدام الفريق.",
          tags: ["take-sides"],
          effects: { tension: 15 },
          next: "j-channel",
          note: { tone: "bad", text: "فرض اعتذارًا علنيًا بدل الاتفاق على قاعدة." },
        },
      ],
    },
    "j-channel": {
      id: "j-channel",
      speaker: "khaled",
      line: "موافق. وأعتذر عن الرسالة، كانت لحظة غضب.",
      next: "j-close",
    },
    "j-close": {
      id: "j-close",
      speaker: "sara",
      line: "وأنا بذكر شغل خالد بالاسم في اجتماع الإدارة الجاي.",
      choices: [
        {
          id: "j-written",
          label: "اتفاق ممتاز. بكتب النقاط وأرسلها لكم، ونجتمع بعد أسبوعين نتابع.",
          tags: ["solution"],
          effects: { tension: -10 },
          next: "j-end-good",
          note: { tone: "good", text: "وثّق الاتفاق وحدد موعد متابعة." },
        },
        {
          id: "j-done",
          label: "تمام، كذا انتهينا.",
          tags: ["passive"],
          next: "j-end-ok",
        },
      ],
    },
    "j-end-good": { id: "j-end-good", speaker: "sara", line: "شكرًا، كانت جلسة مفيدة.", end: "success" },
    "j-end-ok": { id: "j-end-ok", speaker: "khaled", line: "طيب.", end: "neutral" },
    "j-end-fail": { id: "j-end-fail", speaker: "sara", line: "(تغادر الغرفة) ارفعوه للي تبون.", end: "fail" },
    "j-walkout": { id: "j-walkout", speaker: "khaled", line: "(يقف) آسف، ما أقدر أكمل بهالطريقة.", end: "fail" },
  },
};

// ---------- resolution plan ----------

export type ResolutionAction = {
  id: string;
  label: string;
  /** Facts this action addresses (counts only if discovered). */
  addresses?: readonly HrFact[];
  /** Policy clause it breaks. */
  violates?: string;
  /** Policy clause it applies. */
  applies?: string;
  weak?: string;
};

export const resolutionActions: readonly ResolutionAction[] = [
  { id: "r-rota", label: "جدول مناوبات دوري بين أعضاء الفريق، بحد أقصى أسبوعين", addresses: ["khaled-overload"], applies: "p3" },
  { id: "r-credit", label: "قالب للعروض يذكر المساهمين بالاسم", addresses: ["khaled-credit", "sara-pressure"], applies: "p2" },
  { id: "r-present", label: "سارة تعرض عمل خالد في اجتماع الإدارة القادم بحضوره", addresses: ["khaled-credit"] },
  { id: "r-private", label: "اتفاق مكتوب: الخلافات تُطرح بشكل خاص أولًا", addresses: ["sara-attitude"], applies: "p1" },
  { id: "r-followup", label: "جلسة متابعة بعد أسبوعين لقياس التقدّم", addresses: ["shared-goal"] },
  { id: "r-warning", label: "إنذار كتابي لخالد بسبب رسالته", violates: "p5" },
  { id: "r-share", label: "مشاركة ما قالته سارة في جلستها مع خالد لتوضيح موقفها", violates: "p4" },
  { id: "r-transfer", label: "نقل خالد إلى فريق آخر", weak: "يتجنب المشكلة ويخسر الفريق أقوى مطوّريه قبل الإطلاق." },
  { id: "r-ignore", label: "تأجيل الموضوع حتى ما بعد الإطلاق", weak: "يترك عبء المناوبات مخالفًا للسياسة ويؤجل الانفجار." },
];

// ---------- quizzes ----------

export const hrPreQuiz: readonly QuizQuestion[] = [
  {
    prompt: "موظف يبدأ الجلسة الفردية بقوله «ما له فايدة». ماذا تفعل؟",
    options: [
      { label: "أذكّره أن الحضور إلزامي", points: 0, style: "assertive" },
      { label: "أشكره على حضوره وأوضح أن الجلسة سرية ومخصصة له", points: 2, style: "collaborative" },
      { label: "أنهي الجلسة وأحاول لاحقًا", points: 0, style: "avoidant" },
    ],
    explain: "الأمان النفسي والسرية شرطان ليبوح الطرف بما يزعجه فعلًا.",
  },
  {
    prompt: "أحد الطرفين يخبرك بمعلومة حساسة عن الآخر. ما الصواب؟",
    options: [
      { label: "أنقلها للطرف الآخر لتوضيح الصورة", points: 0, style: "assertive" },
      { label: "أستأذنه قبل استخدامها، أو أشجعه على طرحها بنفسه", points: 2, style: "collaborative" },
      { label: "أتجاهلها تمامًا", points: 1, style: "avoidant" },
    ],
    explain: "السرية أساس الثقة في الوساطة؛ لا تنقل دون إذن.",
  },
  {
    prompt: "في الجلسة المشتركة بدأ الطرفان يتبادلان الاتهامات. أفضل تدخل؟",
    options: [
      { label: "أحدد من المخطئ لإنهاء الجدل", points: 0, style: "assertive" },
      { label: "أوقف الحوار وأتفق معهما على قواعد: لا مقاطعة، ونبدأ بالحقائق", points: 2, style: "analytical" },
      { label: "أترك الطرفين يفرغان غضبهما", points: 1, style: "avoidant" },
    ],
    explain: "القواعد الأساسية تحوّل الجلسة من صراع إلى حوار منظّم.",
  },
  {
    prompt: "اكتشفت أثناء الوساطة مخالفة لسياسة عبء العمل. ماذا تفعل؟",
    options: [
      { label: "أعالجها كبند مستقل يجب حله بغض النظر عن الخلاف", points: 2, style: "analytical" },
      { label: "أتجاهلها لأنها خارج موضوع الوساطة", points: 0, style: "avoidant" },
      { label: "أستخدمها للضغط على قائد الفريق", points: 0, style: "assertive" },
    ],
    explain: "المخالفات الهيكلية غالبًا هي جذر الخلاف الشخصي.",
  },
  {
    prompt: "متى يكون إنذار تأديبي مناسبًا في جلسة وساطة؟",
    options: [
      { label: "عندما يكون أحد الطرفين مخطئًا بوضوح", points: 0, style: "assertive" },
      { label: "أبدًا داخل الوساطة؛ للتأديب مسار مستقل", points: 2, style: "analytical" },
      { label: "عندما يطلبه الطرف الآخر", points: 0, style: "collaborative" },
    ],
    explain: "خلط الوساطة بالتأديب يهدم حياد الوسيط وثقة الطرفين.",
  },
];

export const hrPostQuiz: readonly QuizQuestion[] = [
  {
    prompt: "ما فائدة إعادة صياغة كلام الطرف («يعني جهدك ما انشاف…»)؟",
    options: [
      { label: "إثبات أن الوسيط يفهم أكثر", points: 0 },
      { label: "إشعار الطرف أنه مسموع وتأكيد الفهم", points: 2 },
      { label: "كسب الوقت", points: 0 },
    ],
    explain: "الاستماع الفعّال يخفض التوتر ويصحّح سوء الفهم مبكرًا.",
  },
  {
    prompt: "أي خطة حل أقوى؟",
    options: [
      { label: "اعتذار علني من الطرفين", points: 0 },
      { label: "إجراءات محددة لكل جذر (المناوبات، نسب العمل، قناة الخلاف) مع متابعة", points: 2 },
      { label: "نقل أحد الطرفين لفريق آخر", points: 0 },
    ],
    explain: "الحل الجيد يعالج الأسباب الهيكلية لا الأعراض فقط، ويُتابَع.",
  },
  {
    prompt: "متى تبدأ بالقضية الأسهل في الجلسة المشتركة؟",
    options: [
      { label: "عندما تكون محكومة بسياسة واضحة وتبني زخمًا للاتفاق", points: 2 },
      { label: "أبدًا، ابدأ دائمًا بالأصعب", points: 0 },
      { label: "عندما يطلب ذلك الطرف الأقوى", points: 0 },
    ],
    explain: "الاتفاقات الصغيرة المبكرة تبني الثقة للقضايا الأصعب.",
  },
];

// ---------- observer rubric ----------

export type HrSessions = { khaled: DialogueState; sara: DialogueState; joint: DialogueState };

export function scoreHr(sessions: HrSessions, plan: string[]): { scorecard: Scorecard; peaceMade: boolean } {
  const all = [sessions.khaled, sessions.sara, sessions.joint];
  const facts = new Set(all.flatMap((s) => s.facts) as HrFact[]);
  const count = (...tags: string[]) => all.reduce((sum, s) => sum + tagCount(s, ...tags), 0);
  const highlights: Highlight[] = [];
  const labels: [DialogueState, string][] = [
    [sessions.khaled, "خالد"],
    [sessions.sara, "سارة"],
    [sessions.joint, "مشتركة"],
  ];
  for (const [state, label] of labels) {
    for (const entry of state.transcript) {
      if (entry.note) highlights.push({ at: `${label} · ${clock(entry.at)}`, tone: entry.note.tone, text: entry.note.text });
    }
  }

  const empathy = 30 + count("empathy", "listen") * 9 + count("reframe") * 6 - count("dismiss") * 10;
  const neutrality = 100 - count("take-sides") * 22 - count("blame") * 15 + count("neutral") * 5;

  let policyScore = 50 + count("policy") * 10 - count("breach") * 30 - count("discipline") * 25;
  const chosen = plan.map((id) => resolutionActions.find((a) => a.id === id)).filter((a): a is ResolutionAction => Boolean(a));
  for (const action of chosen) {
    if (action.violates) {
      policyScore -= 25;
      const clause = policy.find((p) => p.id === action.violates);
      highlights.push({ at: "خطة الحل", tone: "bad", text: `«${action.label}» يخالف بند «${clause?.title}».` });
    }
    if (action.applies) policyScore += 5;
  }

  const finalTension = sessions.joint.meters.tension;
  const deEscalation = (100 - finalTension) * 0.8 + count("de-escalate") * 10 - (sessions.joint.outcome === "fail" ? 30 : 0);

  let resolution = 10;
  const addressed = new Set<HrFact>();
  for (const action of chosen) {
    if (action.weak) {
      resolution -= 15;
      highlights.push({ at: "خطة الحل", tone: "bad", text: action.weak });
      continue;
    }
    if (action.violates) continue;
    const covers = (action.addresses ?? []).filter((fact) => facts.has(fact));
    for (const fact of covers) addressed.add(fact);
    resolution += covers.length ? 15 : 3;
  }
  resolution += addressed.size * 6;
  if (sessions.joint.outcome === "success") resolution += 10;

  const dimensions: Dimension[] = [
    {
      key: "empathy",
      label: "الاستماع الفعّال والتعاطف",
      score: empathy,
      weight: 2,
      skill: "empathy",
      praise: "استمعت وأعدت الصياغة، فشعر كل طرف أنه مسموع.",
      tip: "أعد صياغة ما تسمعه («يعني…؟») قبل أن تعلّق أو تقترح.",
    },
    {
      key: "neutrality",
      label: "الحياد",
      score: neutrality,
      weight: 2,
      skill: "communication",
      praise: "حافظت على حيادك أمام الطرفين.",
      tip: "لا تحكم على أحد الطرفين قبل سماع الروايتين، وخاصة أمام الآخر.",
    },
    {
      key: "policy",
      label: "الالتزام بالسياسة",
      score: policyScore,
      weight: 2,
      skill: "decision",
      praise: "استخدمت السياسة كمرجع محايد للحل.",
      tip: "احفظ السرية، وافصل التأديب عن الوساطة، واستند للبنود في الحل.",
    },
    {
      key: "deescalation",
      label: "خفض التوتر",
      score: deEscalation,
      weight: 2,
      skill: "empathy",
      praise: `أنهيت الجلسة المشتركة بتوتر ${finalTension}٪ فقط.`,
      tip: "عند التصعيد: أوقف، اتفق على قواعد الحوار، وعد للحقائق.",
    },
    {
      key: "resolution",
      label: "جودة خطة الحل",
      score: resolution,
      weight: 2,
      skill: "decision",
      praise: "خطة الحل تعالج جذور الخلاف وتتضمن متابعة.",
      tip: "اختر إجراءً محددًا لكل سبب اكتشفته، وأضف موعد متابعة.",
    },
  ];

  const peaceMade = sessions.joint.outcome === "success" && finalTension <= 35;
  const verdict =
    sessions.joint.outcome === "success"
      ? `انتهت الوساطة باتفاق، والتوتر عند ${finalTension}٪.`
      : sessions.joint.outcome === "fail"
        ? "انهارت الجلسة المشتركة قبل الوصول لاتفاق."
        : "انتهت الجلسة دون اتفاق مكتوب.";
  return { scorecard: buildScorecard({ dimensions, highlights, verdict }), peaceMade };
}
