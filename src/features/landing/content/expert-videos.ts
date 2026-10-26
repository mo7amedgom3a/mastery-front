import { brandColorAt, type BrandColor } from "@/components/ui/brand-colors";

/** The show every episode in this file belongs to. */
const SHOW = "كرسي ماستري";

/** Chip order in the section; the same labels are the tags on the cards. */
export const expertVideoCategories = [
  "المبيعات",
  "التسويق",
  "المالية والمحاسبة",
  "القيادة والإدارة",
  "العلاقات العامة والبروتوكول",
  "الرسم والفنون",
  "القانون والتأمين",
  "مهارات متنوعة",
] as const;

export type ExpertVideoCategory = (typeof expertVideoCategories)[number];

export type ExpertVideo = {
  /** YouTube video id: drives the thumbnail, the embed and the watch link. */
  youtubeId: string;
  title: string;
  /** Show or channel the interview aired on. */
  show: string;
  /** Who appears in the episode, as shown under the stage. Empty until the guest's name is confirmed. */
  host: string;
  role: string;
  category: ExpertVideoCategory;
  /** Runtime as YouTube shows it (m:ss / h:mm:ss). */
  duration: string;
  /** View and like counts as YouTube showed them when the list was curated (static snapshot). */
  views: string;
  likes: string;
  color: BrandColor;
};

type Episode = Omit<ExpertVideo, "show" | "color">;

/**
 * Episodes of "كرسي ماستري" curated from podcast-course-mastery.txt (no API for this yet).
 * The "كرسي ماستري:" prefix is dropped from titles because the section and the card chip already
 * name the show. Guests whose names were cut from the source keep a role-only credit for now.
 */
const episodes: readonly Episode[] = [
  {
    youtubeId: "ef-INNRzZ5M",
    title: "هل قياس ROI هام لنجاح الحملات التسويقية؟!",
    host: "",
    role: "خبير التسويق",
    category: "التسويق",
    duration: "20:32",
    views: "165",
    likes: "12",
  },
  {
    youtubeId: "LXJMWPNxVJs",
    title: "كيف تكتب خطة مبيعات وتنفذها باحترافية",
    host: "م. أيمن السيد",
    role: "خبير المبيعات",
    category: "المبيعات",
    duration: "13:03",
    views: "4,138",
    likes: "154",
  },
  {
    youtubeId: "3TbOJ_5nhPs",
    title: "كيف ينقذ التنبؤ المالي شركتك من شبح الإفلاس!",
    host: "",
    role: "خبير التنبؤ المالي",
    category: "المالية والمحاسبة",
    duration: "26:41",
    views: "982",
    likes: "47",
  },
  {
    youtubeId: "X5Xmb4rQCOg",
    title: "الإدارة المالية للمشاريع الصغيرة والمتوسطة",
    host: "د. مظهر قنطقجي",
    role: "خبير المالية والمحاسبة",
    category: "المالية والمحاسبة",
    duration: "38:33",
    views: "88,516",
    likes: "2,594",
  },
  {
    youtubeId: "96XhtRvHig8",
    title: "المحاسبة للمشاريع الصغيرة والمتوسطة",
    host: "د. رنا التونجي",
    role: "خبيرة المحاسبة",
    category: "المالية والمحاسبة",
    duration: "34:52",
    views: "17,776",
    likes: "615",
  },
  {
    youtubeId: "wmjwNUjcsK8",
    title: "الرسم والتصميم الداخلي يكملان بعضهما",
    host: "حذيفة حجازي",
    role: "فنان تشكيلي",
    category: "الرسم والفنون",
    duration: "2:00",
    views: "448",
    likes: "10",
  },
  {
    youtubeId: "u3dCRDPIEc4",
    title: "ما نحتاجه لتعلم مهارة الرسم من الصفر إلى الاحتراف",
    host: "حذيفة حجازي",
    role: "فنان تشكيلي",
    category: "الرسم والفنون",
    duration: "42:11",
    views: "1,188",
    likes: "25",
  },
  {
    youtubeId: "74sJ-OspLbU",
    title: "ما أهمية المحاسبة في المشاريع الصغيرة والمتوسطة؟",
    host: "د. رنا التونجي",
    role: "خبيرة المحاسبة",
    category: "المالية والمحاسبة",
    duration: "18:57",
    views: "4,026",
    likes: "130",
  },
  {
    youtubeId: "m6hm5LyKUDk",
    title: "كيف تتعلم أساسيات التصوير الفوتوغرافي؟",
    host: "مروة الشرع",
    role: "خبيرة التصوير الفوتوغرافي",
    category: "مهارات متنوعة",
    duration: "26:38",
    views: "1,711",
    likes: "44",
  },
  {
    youtubeId: "sYlTVZOJOHw",
    title: "العقود والاتفاقيات للمشاريع الصغيرة والمتوسطة",
    host: "د. عمار عبدالوهاب",
    role: "خبير القانون والعقود",
    category: "القانون والتأمين",
    duration: "21:02",
    views: "2,185",
    likes: "108",
  },
  {
    youtubeId: "qkrdQfVDXqQ",
    title: "كيف تصبح كوتش مبيعات ناجح في 2024",
    host: "م. أيمن السيد",
    role: "خبير المبيعات",
    category: "المبيعات",
    duration: "23:41",
    views: "1,167",
    likes: "58",
  },
  {
    youtubeId: "bviXlNUxc9E",
    title: "أقوى الاستراتيجيات لكتابة محتوى تسويقي احترافي",
    host: "أ. كريم عصام",
    role: "خبير التسويق وصناعة المحتوى",
    category: "التسويق",
    duration: "23:48",
    views: "758",
    likes: "46",
  },
  {
    youtubeId: "aNEJFSmU1iA",
    title: "طرق واستراتيجيات ناجحة في تسويق وبيع العقارات",
    host: "أ. خالد الحداد",
    role: "خبير التسويق العقاري",
    category: "التسويق",
    duration: "23:38",
    views: "4,405",
    likes: "109",
  },
  {
    youtubeId: "f-dGZ32MKkk",
    title: "هل للاحتيال أشكال وفئات في مجال التأمين؟!",
    host: "أ. أحمد الياسين",
    role: "خبير التأمين",
    category: "القانون والتأمين",
    duration: "26:14",
    views: "118",
    likes: "3",
  },
  {
    youtubeId: "hZmxfWbI70M",
    title: "كيف تكون اللغة الإنجليزية سهلة الفهم والتطبيق في بيئة العمل؟",
    host: "",
    role: "خبير اللغة الإنجليزية",
    category: "مهارات متنوعة",
    duration: "14:11",
    views: "592",
    likes: "27",
  },
  {
    youtubeId: "6EQ2hdMPYG0",
    title: "كيف تساعد الخطة التسويقية في نجاح الشركة؟",
    host: "",
    role: "خبير التسويق",
    category: "التسويق",
    duration: "22:42",
    views: "556",
    likes: "26",
  },
  {
    youtubeId: "EAr8u86Ge78",
    title: "هل أستطيع تأسيس وإدارة مقهى وأنجح فيه؟!",
    host: "",
    role: "خبير إدارة المقاهي",
    category: "مهارات متنوعة",
    duration: "20:27",
    views: "785",
    likes: "25",
  },
  
  {
    youtubeId: "9_pKpNZMmAo",
    title: "كيف يمكن الاستفادة من أتمتة التسويق وتطويعها لخدمة الأعمال؟",
    host: "",
    role: "خبير التسويق الرقمي",
    category: "التسويق",
    duration: "13:16",
    views: "217",
    likes: "11",
  },
  {
    youtubeId: "n-biwbCRNwY",
    title: "كيف يمكن تنظيم وتجهيز وإنجاح المؤتمرات والفعاليات؟",
    host: "",
    role: "خبير تنظيم الفعاليات",
    category: "العلاقات العامة والبروتوكول",
    duration: "20:18",
    views: "188",
    likes: "9",
  },
  {
    youtubeId: "sSVpQdmrsdg",
    title: "لماذا قد تنقطع العلاقات بين الدول أو الشركات؟ البروتوكولات والاتيكيت",
    host: "",
    role: "خبير البروتوكولات والاتيكيت",
    category: "العلاقات العامة والبروتوكول",
    duration: "21:43",
    views: "150",
    likes: "12",
  },
  {
    youtubeId: "tpxrEyDofRg",
    title: "ما هي أهم مهارات البيع الحديثة؟ وكيف أتقنها؟",
    host: "",
    role: "خبير المبيعات",
    category: "المبيعات",
    duration: "27:05",
    views: "503",
    likes: "24",
  },
  {
    youtubeId: "fxutkzIEsbU",
    title: "لماذا الإدارة بالأهداف والنتائج؟ وكيف أطبقها؟",
    host: "",
    role: "خبير الإدارة والقيادة",
    category: "القيادة والإدارة",
    duration: "22:39",
    views: "1,079",
    likes: "50",
  },
  {
    youtubeId: "76JNuFpmvkM",
    title: "هل تختلف الكتابة في العلاقات العامة والصحافة والإعلام؟!",
    host: "",
    role: "خبير العلاقات العامة",
    category: "العلاقات العامة والبروتوكول",
    duration: "30:27",
    views: "233",
    likes: "5",
  },
  {
    youtubeId: "1SPIhvjNubY",
    title: "كيف يمكن للتسويق أن ينقذ قطاع الأغذية والمشروبات F&B؟!",
    host: "",
    role: "خبير تسويق الأغذية والمشروبات",
    category: "التسويق",
    duration: "32:57",
    views: "266",
    likes: "12",
  },
  {
    youtubeId: "4ylpcOrt-mk",
    title: "هل حملات العلاقات العامة تتشابه مع حملات التسويق؟",
    host: "",
    role: "خبير العلاقات العامة",
    category: "العلاقات العامة والبروتوكول",
    duration: "25:45",
    views: "228",
    likes: "5",
  },
  {
    youtubeId: "8x3TW9040rA",
    title: "هل إدارة تطوير الأعمال تستطيع إنقاذ الشركة من الغرق؟!",
    host: "",
    role: "خبير تطوير الأعمال",
    category: "القيادة والإدارة",
    duration: "20:50",
    views: "286",
    likes: "8",
  },
  {
    youtubeId: "o8pMwoIt82A",
    title: "دور سيكولوجية المبيعات في فهم احتياجات العملاء وإغلاق الصفقات",
    host: "",
    role: "خبير المبيعات",
    category: "المبيعات",
    duration: "17:44",
    views: "348",
    likes: "21",
  },
  {
    youtubeId: "1mBomXwOMOc",
    title: "هل تحفيز فرق البيع يحدث الفارق في نجاح الصفقات البيعية؟!",
    host: "",
    role: "خبير المبيعات",
    category: "المبيعات",
    duration: "15:10",
    views: "114",
    likes: "5",
  },
  {
    youtubeId: "58-ethKyAFg",
    title: "هل للاتصال المؤسسي دور في إنجاح العمليات الداخلية بالمنظمات؟!",
    host: "",
    role: "خبير الاتصال المؤسسي",
    category: "القيادة والإدارة",
    duration: "20:33",
    views: "140",
    likes: "7",
  },
  {
    youtubeId: "5VREV07HPNg",
    title: "تعلم القواعد ثم غيّر حسب موهبتك",
    host: "حذيفة حجازي",
    role: "فنان تشكيلي",
    category: "الرسم والفنون",
    duration: "5:10",
    views: "280",
    likes: "5",
  },
];

/** Colours rotate by position so neighbouring cards stay visually distinct in every category. */
export const expertVideos: readonly ExpertVideo[] = episodes.map((episode, index) => ({
  ...episode,
  show: SHOW,
  color: brandColorAt(index),
}));
