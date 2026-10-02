import { routes } from "@/config/routes";

export const spotlightCopy = {
  live: "بث مباشر",
  isNew: "جديد",
  headline: "تعلّم مباشرةً من نخبة الخبراء. دفعات جديدة كل شهر.",
  ledBy: "تقديم",
  details: "تفاصيل الدورة والتسجيل",
  trailer: "شاهد الفيديو التعريفي",
  trailerDialog: "الفيديو التعريفي",
  viewAll: { label: "كل دورات البث المباشر", href: routes.live },
  sar: "ر.س",
} as const;

export const livePageCopy = {
  title: "دورات البث المباشر",
  kicker: "بث مباشر · مقاعد محدودة",
  lead: "دورات مكثفة تحضرها مباشرةً مع المدرب: جلسات تفاعلية، أسئلة وأجوبة بعد كل جلسة، وشهادات معتمدة دولياً.",
  description: "دورات البث المباشر في ماستري أكاديمي: تدريب تفاعلي مباشر مع نخبة الخبراء العرب وشهادات معتمدة دولياً.",
  cardCta: "تفاصيل الدورة",
  empty: {
    title: "لا توجد دورات بث مباشر مفتوحة للتسجيل الآن",
    lead: "نضيف دفعات جديدة كل شهر. إلى ذلك الحين، تصفّح دوراتنا المسجّلة.",
    action: { label: "استكشف الدورات", href: routes.courses },
  },
} as const;

export const detailCopy = {
  bookingLabel: "حجز مقعد في الدورة",
  priceNote: "شامل الشهادة الإلكترونية والمطبوعة",
  enroll: "احجز مقعدك الآن",
  brochure: "معاينة بروشور الدورة (PDF)",
  whatsapp: "استفسر عبر واتساب",
  includes: "يشمل الحجز",
  breadcrumb: "دورات البث المباشر",
  nav: {
    about: "عن الدورة",
    objectives: "الأهداف",
    audience: "لمن الدورة",
    curriculum: "المحاور",
    method: "طريقة التدريب",
    instructor: "المدرب",
    certificate: "الشهادات",
    faq: "الأسئلة الشائعة",
  },
  objectivesTitle: "ماذا ستحقّق بعد الدورة؟",
  audienceTitle: "لمن هذه الدورة؟",
  activitiesTitle: "تدريب وليس كلام",
  methodTitle: "طريقة التدريب",
  instructorTitle: "المدرب",
  certificatesLabel: "الشهادات والمميزات",
  certificatesTitle: "تجربة تعليمية فريدة وشهادتان معتمدتان",
  featuresTitle: "مميزات الدورة",
  faqTitle: "أسئلة شائعة عن الدورة",
  register: {
    title: "ابدأ رحلة الاحتراف الآن",
    lead: "المقاعد محدودة — احجز قبل اكتمال العدد.",
    whatsappLead: "لدينا وقت كافٍ للإجابة على كل استفساراتك حول الدورة، ومساعدتك في إتمام التسجيل بكل سهولة.",
  },
} as const;
