/** Objection lab 2: a finance director who is happy with a competitor, handled with the ruler. */
import type { RulerScenario } from "./types";

export const competitorRulerScenario: RulerScenario = {
  slug: "objections-competitor-ruler",
  mechanic: "ruler",
  seller: "ميزان للمحاسبة السحابية",
  contact: { name: "م. سلطان العتيبي", role: "المدير المالي · مجموعة بناء الشرق", initials: "سع", tone: "purple" },
  dossier: {
    company: "مجموعة بناء الشرق",
    industry: "مقاولات · 4 شركات تابعة",
    size: "1,200 موظف · 4 شركات",
    current: "قيود للمحاسبة السحابية (4 سنوات)",
    budget: "180,000 ر.س سنويًا",
    timeline: "تجديد العقد بعد 6 أسابيع",
    notes: [
      "المدير المالي راضٍ عن قيود، لكنه اشتكى مرتين من تأخر التقارير الضريبية.",
      "الدعم الحالي يرد خلال 48 ساعة، والضريبة تُرفع يدويًا.",
      "المجموعة تفتح شركة خامسة في جدة خلال 6 أشهر.",
    ],
    signals: [
      "يجيب بسرعة عند الحديث عن قيود: اختياره الشخصي.",
      "يتوقف عند سؤال «ما الذي ينقصهم؟» — هنا تبدأ الفجوة.",
      "لا يريد أن يسمع أن اختياره كان خطأ.",
    ],
  },
  steps: [
    {
      id: "praise",
      title: "الخطوة 1 · شكر المنافس",
      prompt: "كيف تفتح الموضوع دون أن تهاجم اختيار العميل؟",
      customerLine: "إحنا مع قيود من أربع سنوات ومرتاحين. ما أشوف سبب أغيّر.",
      options: [
        {
          id: "no-name",
          label: "من غير ما أعرف اسم الشركة، أكيد شركة رائعة لأنها حازت على إعجابك.",
          correct: true,
          why: "لا تطلب الاسم ولا تهاجم؛ اعترف بجودة اختياره أولًا.",
        },
        {
          id: "ask-name",
          label: "مين الشركة؟ عشان أوريك عيوبها.",
          correct: false,
          why: "طلب الاسم يفتح باب الهجوم على اختيار العميل، فيدافع عن نفسه.",
        },
        {
          id: "old",
          label: "كل الأنظمة القديمة تتعب الفريق، الأفضل تغيّر.",
          correct: false,
          why: "قلّلت من قيمة اختياره، فاستفززت دفاعيته.",
        },
      ],
    },
    {
      id: "rating",
      title: "الخطوة 2 · المسطرة",
      prompt: "ما السؤال التالي؟",
      customerLine: "ليش تسأل؟",
      options: [
        {
          id: "out-of-ten",
          label: "تديهم كم من عشرة؟",
          correct: true,
          why: "الرقم يجعل العميل يقيّم بنفسه ويترك مجالًا للفجوة.",
        },
        {
          id: "compare",
          label: "تحب نعمل مقارنة بينهم وبيننا؟",
          correct: false,
          why: "المقارنة المباشرة تعيده إلى موقع الدفاع عن اختياره.",
        },
        {
          id: "price",
          label: "كم تدفعون لهم في السنة؟",
          correct: false,
          why: "السؤال المالي لا يبني جسر المسطرة.",
        },
      ],
    },
    {
      id: "gap",
      title: "الخطوة 3 · الفجوة",
      prompt: "قيّموا المنافس 9 من 10. ما التالي؟",
      customerLine: "تسعة… ليش؟",
      options: [
        {
          id: "what-missing",
          label: "وما الذي ينقصهم لياخدوا عشرة من عشرة؟",
          correct: true,
          why: "اترك العميل هو من يسمّي العيب، ثم اصمت ليفكر.",
        },
        {
          id: "leading",
          label: "يعني في عيب، صح؟",
          correct: false,
          why: "سؤال قائد يضع الكلمات في فمه ويلغي قوة المسطرة.",
        },
        {
          id: "list-flaws",
          label: "خلني أقول لك عيوبهم.",
          correct: false,
          why: "عدت إلى الهجوم المباشر الذي يدافع عنه العميل.",
        },
      ],
    },
    {
      id: "amplify",
      title: "الخطوة 4 · تضخيم الأثر",
      prompt: "كيف تضخّم أثر الفجوة دون أن تفتري على المنافس؟",
      customerLine: "التقارير الضريبية تتأخر 10 أيام، والدعم ما يرد بسرعة.",
      options: [
        {
          id: "consequences",
          label: "كيف يأثر تأخر التقارير على الإقفال الشهري والمستخلصات؟",
          correct: true,
          why: "سؤال أثر يجعل العميل يحسب كلفة الفجوة بنفسه.",
        },
        {
          id: "catastrophe",
          label: "هذا كارثة، لازم تغيّر فورًا.",
          correct: false,
          why: "مبالغة بلا أرقام تجعل العميل يدافع عن المنافس.",
        },
        {
          id: "same",
          label: "كلهم نفس الشي.",
          correct: false,
          why: "ساويت بين الجميع، فأضعفت قيمة الحل قبل عرضه.",
        },
      ],
    },
    {
      id: "what-if",
      title: "الخطوة 5 · ماذا لو",
      prompt: "ما الخطوة الخامسة والأخيرة في المسطرة؟",
      customerLine: "نقعد أسبوعين، ومرة تأخر مستخلص 300 ألف.",
      options: [
        {
          id: "what-if-offer",
          label: "ماذا لو قدمت لك نفس المزايا وحللت هذا النقص، مع ترحيل بدون توقف؟",
          correct: true,
          why: "سؤال مغلق يحوّل الفجوة إلى التزام: نفس المزايا + حل النقص.",
        },
        {
          id: "discount",
          label: "عندنا خصم 20٪ لو انتقلت هذا الشهر.",
          correct: false,
          why: "الخصم لا يعالج الفجوة، ويوحي بأن القيمة أقل.",
        },
        {
          id: "brochure",
          label: "أرسل لك عرضًا ونشوف.",
          correct: false,
          why: "خطوة مفتوحة تضيّع الزخم الذي بنته المسطرة.",
        },
      ],
    },
  ],
  closing: "كلامك منطقي. وش عندك؟",
  benefits: [
    {
      id: "vat",
      label: "تقارير ضريبية جاهزة في وقتها",
      correct: true,
      why: "تعالج الفجوة التي سمّاها العميل: تأخر التقارير.",
    },
    {
      id: "support",
      label: "دعم محلي 24/7",
      correct: true,
      why: "تعالج الفجوة الثانية: بطء الدعم.",
    },
    {
      id: "consolidation",
      label: "توحيد الشركات الأربع في لوحة واحدة",
      correct: true,
      why: "ميزة إضافية تخص مجموعة متعددة الشركات.",
    },
    {
      id: "migration",
      label: "ترحيل بدون توقف للعمل",
      correct: true,
      why: "تزيل الخوف الأكبر من التغيير.",
    },
    {
      id: "color",
      label: "واجهة بلون أزرق جديد",
      correct: false,
      why: "ميزة شكلية لا تعالج فجوة العميل.",
    },
    {
      id: "cheap",
      label: "أرخص 30٪ من المنافس",
      correct: false,
      why: "ادعاء غير صحيح ويحوّل النقاش إلى سعر.",
    },
  ],
  commitment: {
    prompt: "اختر الخطوة التالية التي تحوّل الفجوة إلى تجربة.",
    options: [
      {
        id: "pilot",
        label: "تجربة على شركة واحدة 45 يومًا + خطة ترحيل + مؤشرات نجاح",
        quality: 2,
        stage: "pilot",
        nextStep: "pilot",
        note: { tone: "good", text: "تجربة محدودة النطاق تحترم رضا العميل وتحمي استمرارية العمل." },
      },
      {
        id: "proposal",
        label: "إرسال عرض ومقارنة تفصيلية",
        quality: 1,
        stage: "proposal",
        nextStep: "send-proposal",
        note: { tone: "info", text: "عرض مفيد، لكنه لا يختبر الفجوة عمليًا." },
      },
      {
        id: "discount",
        label: "خصم 15٪ لو انتقل هذا الشهر",
        quality: 0,
        stage: "discovery",
        nextStep: "discount",
        note: { tone: "bad", text: "الخصم يهدم منطق المسطرة ويحوّل الحوار إلى سعر." },
      },
    ],
  },
  crm: {
    stages: [
      { id: "discovery", label: "اكتشاف مكتمل" },
      { id: "proposal", label: "عرض مُرسل" },
      { id: "pilot", label: "تجربة على شركة واحدة" },
      { id: "lost", label: "مغلقة · خسارة" },
    ],
    nextSteps: [
      { id: "pilot", label: "بدء تجربة 45 يومًا + خطة ترحيل" },
      { id: "send-proposal", label: "إرسال عرض ومقارنة" },
      { id: "discount", label: "عرض خصم" },
      { id: "none", label: "لا توجد خطوة تالية" },
    ],
    notes: [
      { id: "n-vendor", label: "المنافس قيود", correct: true },
      { id: "n-gap", label: "الفجوة: تقارير ضريبية متأخرة ودعم بطيء", correct: true },
      { id: "n-companies", label: "4 شركات تابعة", correct: true },
      { id: "n-pilot", label: "تجربة شركة واحدة 45 يومًا", correct: true },
      { id: "n-unhappy", label: "العميل غير راضٍ عن المنافس", correct: false },
      { id: "n-price", label: "السعر هو المشكلة", correct: false },
    ],
  },
  preQuiz: [
    {
      prompt: "عميل راضٍ عن منافسك. ما أول خطوة؟",
      options: [
        { label: "أطلب اسم المنافس وأعدد عيوبه", points: 0, style: "assertive" },
        { label: "أشكره وأشيد باختياره دون معرفة الاسم", points: 2, style: "collaborative" },
        { label: "أقدم خصمًا فوريًا", points: 0, style: "avoidant" },
      ],
      explain: "العميل يدافع عن اختياره؛ ابدأ بالاعتراف بجودة الاختيار.",
    },
    {
      prompt: "ما الغرض من سؤال «تديهم كم من عشرة؟»",
      options: [
        { label: "جعل العميل يقيّم المنافس بنفسه ويكشف الفجوة", points: 2, style: "analytical" },
        { label: "معرفة سعر المنافس", points: 0, style: "assertive" },
        { label: "إحراج العميل", points: 0, style: "avoidant" },
      ],
      explain: "المسطرة تجعل العميل هو من يقيّم ويسمّي النقص.",
    },
    {
      prompt: "بعد أن يقول العميل «9 من 10»، ماذا تفعل؟",
      options: [
        { label: "أسأل: وما الذي ينقصهم لياخدوا 10؟ ثم أصمت", points: 2, style: "analytical" },
        { label: "أقول له إن المنافس سيئ", points: 0, style: "assertive" },
        { label: "أغيّر الموضوع", points: 0, style: "avoidant" },
      ],
      explain: "الصمت بعد السؤال يمنح العميل مساحة ليكشف العيب بنفسه.",
    },
    {
      prompt: "ما الخطوة التي تسبق عرض الحل؟",
      options: [
        { label: "تضخيم أثر الفجوة على العميل", points: 2, style: "collaborative" },
        { label: "عرض السعر", points: 0, style: "assertive" },
        { label: "إرسال بروشور", points: 0, style: "avoidant" },
      ],
      explain: "الحل بلا أثر واضح يبدو ميزة إضافية لا ضرورة.",
    },
    {
      prompt: "لماذا لا نطلب اسم المنافس؟",
      options: [
        { label: "لأن العميل يدافع عن اختياره لا عن المنافس", points: 2, style: "analytical" },
        { label: "لأننا لا نعرف المنافس", points: 0, style: "avoidant" },
        { label: "لأن الاسم سر", points: 0, style: "assertive" },
      ],
      explain: "طلب الاسم يفتح جبهة دفاع لا تحتاجها.",
    },
  ],
  postQuiz: [
    {
      prompt: "ما ترتيب خطوات المسطرة الخمس؟",
      options: [
        { label: "شكر دون اسم → كم من عشرة → ما ينقصهم → تضخيم الأثر → ماذا لو", points: 2 },
        { label: "اسم المنافس → عيوبه → السعر → الخصم → الإغلاق", points: 0 },
        { label: "عرض المنتج → المقارنة → الخصم → الإغلاق", points: 0 },
      ],
      explain: "المسطرة تبدأ بالاعتراف وتنتهي بسؤال «ماذا لو» المغلق.",
    },
    {
      prompt: "لماذا نضخّم أثر الفجوة قبل عرض الحل؟",
      options: [
        { label: "لأن الأثر الواضح يجعل الحل ضرورة لا ميزة إضافية", points: 2 },
        { label: "لأنه يطيل المكالمة", points: 0 },
        { label: "لأنه يخيف العميل", points: 0 },
      ],
      explain: "كلما كان الأثر ملموسًا بالأرقام، كان الحل أقرب للالتزام.",
    },
    {
      prompt: "ما الخطر الأكبر عند مهاجمة المنافس؟",
      options: [
        { label: "يجعل العميل يدافع عن اختياره ويغلق الحوار", points: 2 },
        { label: "يرفع سعر المنتج", points: 0 },
        { label: "يطيل العرض", points: 0 },
      ],
      explain: "الهجوم على المنافس هجوم على قرار العميل نفسه.",
    },
  ],
};
