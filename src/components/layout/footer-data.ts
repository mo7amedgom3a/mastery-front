import type { Route } from "next";

import { routes } from "@/config/routes";

export type FooterSearchLink = {
  label: string;
  href: Route;
};

export type FooterDirectoryColumn = {
  title: string;
  links: readonly FooterSearchLink[];
};

export type FooterNavColumn = {
  title: string;
  links: readonly { label: string; href: Route }[];
};

/**
 * Enterprise trust banner shown at the top of the footer.
 * Similar to Udemy Business trust banner.
 */
export const enterpriseBannerData = {
  tag: "ماستري للأعمال",
  title: "تعتمد كبرى الشركات والجهات على ماستري لتطوير مهارات فرق العمل",
  description:
    "حلول تدريب مخصصة للمؤسسات، مسارات مهنية وفق احتياج كل قسم، ولوحات متابعة وتقارير لمدراء التدريب مع نخبة من الخبراء الممارسين.",
  primaryAction: { label: "اكتشف حلول الشركات", href: routes.business },
  secondaryAction: { label: "طلب عرض تدريبي", href: routes.businessRequest() },
  highlights: [
    { label: "أكثر من 15,000+ موظف ومحترف تم تدريبهم" },
    { label: "برامج مخصصة للشركات والجهات الحكومية" },
    { label: "شهادات مهنية معتمدة ضمن إطار CPD" },
  ],
} as const;

/**
 * 4-column directory for exploring top skills, categories, tags, and common search combinations.
 * Follows the search URL filter contract (skills, tags, categories, product types).
 */
export const skillDirectoryColumns: readonly FooterDirectoryColumn[] = [
  {
    title: "المهارات الأكثر طلباً",
    links: [
      { label: "المشتريات وسلاسل الإمداد", href: "/search?skill=operations/procurement" as Route },
      { label: "التسويق الرقمي المتكامل", href: "/search?skill=marketing/digital-marketing" as Route },
      { label: "إدارة المشاريع الاحترافية", href: "/search?skill=business/project-management" as Route },
      { label: "استراتيجية وتخطيط الأعمال", href: "/search?skill=business/strategy" as Route },
      { label: "تحليل البيانات ومؤشرات الأداء", href: "/search?skill=data/analysis" as Route },
      { label: "التسويق عبر وسائل التواصل", href: "/search?skill=marketing/social-media" as Route },
      { label: "القيادة وإدارة الفرق", href: "/search?skill=business/leadership" as Route },
      { label: "الإدارة المالية للمديرين", href: "/search?skill=finance/financial-management" as Route },
    ],
  },
  {
    title: "المجالات التخصصية",
    links: [
      { label: "التسويق المتكامل", href: routes.category(27) },
      { label: "الإدارة والقيادة", href: routes.category(20) },
      { label: "المبيعات وخدمة العملاء", href: routes.category(3) },
      { label: "المالية والمحاسبة", href: routes.category(29) },
      { label: "الذكاء الاصطناعي والتقنية", href: routes.category(21) },
      { label: "الموارد البشرية والتدريب", href: routes.category(5) },
      { label: "الحوكمة وإدارة المخاطر", href: routes.category(35) },
      { label: "الفاعلية الشخصية وتطوير الذات", href: routes.category(4) },
    ],
  },
  {
    title: "الموضوعات والوسوم الشائعة",
    links: [
      { label: "التسويق", href: "/search?tag=marketing" as Route },
      { label: "الذكاء الاصطناعي", href: "/search?tag=ai" as Route },
      { label: "التجارة الإلكترونية", href: "/search?tag=ecommerce" as Route },
      { label: "المبيعات والتفاوض", href: "/search?tag=sales" as Route },
      { label: "خدمة العملاء", href: "/search?tag=customer-service" as Route },
      { label: "ريادة الأعمال", href: "/search?tag=entrepreneurship" as Route },
      { label: "تحليل البيانات", href: "/search?tag=data-analysis" as Route },
      { label: "إكسل للأعمال", href: "/search?tag=excel" as Route },
    ],
  },
  {
    title: "عمليات بحث موصى بها",
    links: [
      { label: "الفاعلية الشخصية في التسويق", href: "/search?category=legacy-category-4&tag=marketing" as Route },
      { label: "دورات التسويق الرقمي", href: "/search?type=course&skill=marketing/digital-marketing" as Route },
      { label: "دبلومات الإدارة والقيادة", href: "/search?type=diploma&category=legacy-category-20" as Route },
      { label: "الذكاء الاصطناعي في الأعمال", href: "/search?category=legacy-category-21&tag=ai" as Route },
      { label: "استشارات المبيعات وإدارة الحسابات", href: "/search?type=consultation&tag=sales" as Route },
      { label: "باقات التجارة الإلكترونية الشاملة", href: "/search?type=package&tag=ecommerce" as Route },
    ],
  },
];

/**
 * Main platform navigation columns including dedicated Enterprise & Pricing section.
 */
export const navigationColumns: readonly FooterNavColumn[] = [
  {
    title: "حلول الشركات والاشتراكات",
    links: [
      { label: "ماستري للأعمال (للشركات)", href: routes.business },
      { label: "خطط واشتراكات الأفراد", href: routes.subscriptionsFor("individual") },
      { label: "اشتراكات فرق العمل والشركات", href: routes.subscriptionsFor("company") },
      { label: "باقات التدريب الجاهزة", href: routes.packages },
      { label: "حزم دبلومات واستشارات", href: routes.section("bundles") },
      { label: "طلب عرض تدريبي لمؤسستك", href: routes.businessRequest() },
    ],
  },
  {
    title: "تعلّم والبرامج التدريبية",
    links: [
      { label: "الدورات التدريبية", href: routes.courses },
      { label: "الدبلومات المتخصصة", href: routes.diplomas },
      { label: "البث المباشر وورش العمل", href: routes.live },
      { label: "جلسات الاستشارات الفردية", href: routes.consultations },
      { label: "تصفح كل البرامج التدريبية", href: routes.search },
    ],
  },
  {
    title: "عن الأكاديمية",
    links: [
      { label: "حول ماستري أكاديمي", href: routes.section("about") },
      { label: "نخبة الخبراء والمدربين", href: routes.section("experts") },
      { label: "انضم لنا كمدرب", href: routes.trainers },
      { label: "التسويق بالعمولة", href: routes.marketers },
      { label: "الأسئلة الشائعة", href: routes.section("faq") },
    ],
  },
  {
    title: "المساعدة والقانونية",
    links: [
      { label: "سلة المشتريات", href: routes.cart },
      { label: "سياسة الخصوصية", href: routes.privacy },
      { label: "الشروط والأحكام", href: routes.terms },
    ],
  },
];
