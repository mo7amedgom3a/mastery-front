import { routes } from "@/config/routes";

export const spotlightCopy = {
  live: "بث مباشر",
  isNew: "جديد",
  headline: "تعلّم مباشرةً من نخبة الخبراء. دفعات جديدة كل شهر.",
  ledBy: "تقديم",
  enroll: "احجز مقعدك",
  trailer: "شاهد الإعلان",
  trailerDialog: "الإعلان التعريفي",
  viewAll: { label: "كل دورات البث المباشر", href: routes.live },
  sar: "ر.س",
} as const;

export const livePageCopy = {
  title: "دورات البث المباشر",
  kicker: "بث مباشر · مقاعد محدودة",
  lead: "دورات مكثفة تحضرها مباشرةً مع المدرب: جلسات تفاعلية، أسئلة وأجوبة بعد كل جلسة، وشهادات معتمدة دولياً.",
  description: "دورات البث المباشر في ماستري أكاديمي: تدريب تفاعلي مباشر مع نخبة الخبراء العرب وشهادات معتمدة دولياً.",
  cardCta: "احجز مقعدك",
  empty: {
    title: "لا توجد دورات بث مباشر مفتوحة للتسجيل الآن",
    lead: "نضيف دفعات جديدة كل شهر. إلى ذلك الحين، تصفّح دوراتنا المسجّلة.",
    action: { label: "استكشف الدورات", href: routes.courses },
  },
} as const;
