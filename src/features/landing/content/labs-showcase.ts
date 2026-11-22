/**
 * Copy and the playable teaser for the landing "practice labs" section.
 *
 * The dialogue is a trimmed copy of the support lab's opening (`src/features/labs/content/support.ts`,
 * graph `support-chat`): same lines, choices, meter effects and observer notes, so the teaser and
 * the full lab match. It is copied, not imported, so the landing bundle does not pull the labs engine.
 * Keep it in sync if the support script changes.
 */

export type DemoMeters = { tension: number; trust: number };

export type DemoChoice = {
  id: string;
  label: string;
  effects: Partial<DemoMeters>;
  note: { tone: "good" | "bad"; text: string };
  next: DemoNodeId;
};

export type DemoNodeId = "open" | "verify" | "verify-cold" | "needs" | "process" | "public";

export type DemoNode = { line: string; choices?: readonly DemoChoice[] };

export const demoPersona = { name: "أم فيصل", role: "عميلة منذ 2019", initials: "أف" } as const;

export const demoLab = {
  slug: "support-angry-customer",
  title: "مختبر العميل الغاضب",
  brief: "ثلاجة وصلت مكسورة، المبلغ خُصم مرتين، والعميلة تهدد بالنشر في إكس. ردّك يغيّر كل شيء.",
} as const;

/** Same starting meters as the lab; tension at 100 means she posts publicly (the lab's breakpoint). */
export const demoInitial: DemoMeters = { tension: 75, trust: 20 };
export const DEMO_BREAKPOINT = 100;
/** Turns the teaser plays before it hands over to the full lab. */
export const DEMO_TURNS = 2;

export const demoNodes: Record<DemoNodeId, DemoNode> = {
  open: {
    line: "للمرة الثالثة أكلم خدمتكم! الثلاجة وصلت مكسورة، وسحبتوا فلوسي مرتين! والحين بكتب في تويتر عن تعاملكم.",
    choices: [
      {
        id: "empathise",
        label: "أعتذر لك يا أم فيصل، ومن حقك تكونين زعلانة بعد ثلاث مكالمات. أنا معك الحين للآخر. ممكن رقم الطلب عشان أشوف كل شي بنفسي؟",
        effects: { tension: -15, trust: 10 },
        next: "verify",
        note: { tone: "good", text: "بدأ بالاعتراف بالمشاعر وتحمّل الملكية قبل طلب البيانات." },
      },
      {
        id: "script",
        label: "أهلًا بك في خدمة عملاء بيتك. ممكن رقم الطلب لو سمحتِ؟",
        effects: { tension: 5 },
        next: "verify-cold",
        note: { tone: "bad", text: "رد آلي بنص جاهز على عميلة غاضبة." },
      },
      {
        id: "blame-courier",
        label: "يا ستي الكسر غالبًا من شركة الشحن، مو منا.",
        effects: { tension: 25, trust: -10 },
        next: "public",
        note: { tone: "bad", text: "ألقى اللوم على شركة الشحن أمام العميلة." },
      },
    ],
  },
  verify: {
    line: "رقم الطلب 48213. الباب مكسور والجهة اليمين مدعوسة، وأرسلت الصور مرتين. وشوف حسابي البنكي، خصمتوا 4,299 مرتين!",
    choices: [
      {
        id: "acknowledge-facts",
        label: "شفت الصور، وشفت الخصم المكرر 4,299 مرتين. هذا خطأ منا وما المفروض يصير، وما تحتاجين تثبتين شي ثاني.",
        effects: { tension: -10, trust: 10 },
        next: "needs",
        note: { tone: "good", text: "تحقق بنفسه من الأدلة واعترف بالخطأين بوضوح." },
      },
      {
        id: "open-report",
        label: "لازم نفتح بلاغ للمستودع، ويُرد عليك خلال 5 أيام عمل.",
        effects: { tension: 15 },
        next: "process",
        note: { tone: "bad", text: "أحالها لإجراء طويل مرة رابعة." },
      },
    ],
  },
  "verify-cold": {
    line: "رقم الطلب 48213. ولا تقول لي انتظري!",
    choices: [
      {
        id: "warm-up",
        label: "ما راح أقول لك انتظري. أعتذر عن اللي صار، خليني أفتح الطلب الحين قدامي.",
        effects: { tension: -8, trust: 5 },
        next: "verify",
        note: { tone: "good", text: "تدارك البداية الباردة باعتذار صادق." },
      },
      {
        id: "system-says",
        label: "النظام يقول إن الطلب تم تسليمه بنجاح.",
        effects: { tension: 20, trust: -10 },
        next: "public",
        note: { tone: "bad", text: "واجه العميلة بالنظام بدل أن يسمعها." },
      },
    ],
  },
  needs: { line: "طيب… وش بتسوون؟" },
  process: { line: "خمس أيام؟! وفلوسي؟ والثلاجة؟ عندي أطفال، والأكل اللي كان في الثلاجة القديمة خرب وأنا أنتظركم!" },
  public: { line: "خلاص! نشرت الصور في تويتر ومنشنت حسابكم. وأبي المدير الحين." },
};

/** Things the other labs make you do, each linking to its lab. */
export const labMoments = [
  { slug: "marketing-ads", icon: "megaphone", text: "أطلق حملة لمحمصة قهوة بميزانية 100$ فقط، وحقق 50 ألف ظهور." },
  { slug: "cfo-forecast-runway", icon: "chart", text: "ابنِ نموذج مدرج 18 شهرًا، ودافع عنه أمام مستثمر يبدأ بالسيناريو المتشائم." },
  { slug: "crisis-data-leak", icon: "shield", text: "72 ساعة لاحتواء تسرّب بيانات 3,100 عميل وكتابة البيان الرسمي." },
  { slug: "audit-escape-room", icon: "lock", text: "افتح خمسة أقفال تدقيق قبل لجنة الاستحواذ بـ45 دقيقة." },
] as const;

export type LabMomentIcon = (typeof labMoments)[number]["icon"];

/** «دورة فيديو تقليدية» vs «مختبر ماستري». */
export const comparisonRows = [
  { video: "تشاهد المدرّب يشرح الموقف", lab: "أنت داخل الموقف، وكل قرار يغيّر النتيجة" },
  { video: "اختبار اختيار من متعدد في النهاية", lab: "عملاء وزملاء ومستثمرون يردّون على كل كلمة" },
  { video: "أمثلة عامة لا تشبه عملك", lab: "عقود ومستندات وأرقام وCRM من بيئة عمل حقيقية" },
  { video: "الخطأ لا يكلّف شيئًا", lab: "للخطأ ثمن: عميلة تنشر في إكس، نقد ينفد، طلب حكومي يُرفض" },
  { video: "شهادة حضور", lab: "تقييم مراقب على كل مهارة وملف مهاري يكبر معك" },
] as const;
