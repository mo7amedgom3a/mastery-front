import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";

export const heroCopy = {
  kicker: `أكاديمية ماستري · منذ ${siteConfig.foundingYear}`,
  title: "نبني قادة العصر الرقمي",
  lead: "تعلّم التسويق والإدارة والقيادة وريادة الأعمال بالعربية، من خبراء يمارسون ما يدرّسونه — دورات مسجّلة، دبلومات مباشرة، باقات واستشارات فردية.",
  primary: { label: "استكشف الدورات", href: routes.courses },
  secondary: { label: "حلول تدريب الشركات", href: routes.business },
} as const;

export const aboutCopy = {
  label: "من نحن",
  title: "منصة عربية للتعلّم عن بُعد، صُنعت لتمكين الشباب العربي",
  paragraphs: [
    `أكاديمية ماستري منصة إلكترونية للتعلم عن بُعد باللغة العربية، في مجالات التسويق والإدارة والقيادة وريادة الأعمال. تأسست عام ${siteConfig.foundingYear} بمبادرة من ثابت حجازي وسهل مهدي، حرصاً منهما على تقديم تجربة تعليمية ثرية لشباب الوطن العربي بالأساليب والوسائل العلمية الحديثة.`,
    "نسعى بجهد وإخلاص أن نصبح المنصة الرائدة في التعليم عن بُعد باللغة العربية لتمكين الشباب العربي.",
  ],
  teamImage: {
    src: "https://live.emasteryacademy.com/uploads/bb41b6f7-7e77-4d35-9d2e-4d10fac8aa0f.png",
    alt: "مجموعة من خبراء ومدرّبي أكاديمية ماستري",
    width: 1280,
    height: 853,
  },
  videoLabel: "فيديو تعريفي بأكاديمية ماستري",
} as const;

export const ctaBandCopy = {
  title: "لنبدأ التعلّم اليوم.",
  lead: "أنشئ حسابك مجاناً وابدأ أول دورة في دقائق.",
  action: { label: "أنشئ حسابك الآن", href: routes.register },
} as const;
