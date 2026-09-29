import type { Route } from "next";

import type { BrandColor } from "@/components/ui/brand-colors";
import { routes } from "@/config/routes";

export type OfferingId = "courses" | "diplomas" | "live" | "packages" | "consultations" | "business";

export type Offering = {
  id: OfferingId;
  label: string;
  title: string;
  body: string;
  points: readonly string[];
  cta: { label: string; href: Route };
  color: BrandColor;
  // Poster field is disabled for now; kept for a possible return of the colour-block panel.
  // /** Large word set on the poster field. */
  // poster: string;
};

export const offerings: readonly Offering[] = [
  {
    id: "courses",
    label: "الدورات",
    title: "دورات مسجّلة تتعلّمها بإيقاعك",
    body: "محتوى عملي مركّز يقدّمه خبراء ماستري، تشاهده متى شئت ومن أي جهاز، وتطبّق ما تتعلّمه في عملك فوراً.",
    points: ["وصول مرن من أي جهاز", "تمارين وتطبيقات عملية", "شهادة إتمام إلكترونية"],
    cta: { label: "تصفّح الدورات", href: routes.courses },
    color: "coral",
    // poster: "تعلّم",
  },
  {
    id: "diplomas",
    label: "الدبلومات",
    title: "دبلومات احترافية على دفعات",
    body: "مسارات أعمق تجمع عدة وحدات تدريبية في برنامج متكامل، تُقدَّم على دفعات مع خبراء ماستري وتنتهي بشهادة.",
    points: ["برامج متكاملة متعددة الوحدات", "دفعات بمواعيد محددة", "متابعة وتقييم مع المدرّب"],
    cta: { label: "تصفّح الدبلومات", href: routes.diplomas },
    color: "yellow",
    // poster: "تخصّص",
  },
  {
    id: "live",
    label: "البث المباشر",
    title: "سجّل مقعدك في الجلسات المباشرة",
    body: "جلسات تفاعلية تُبث مباشرة مع الخبراء: سجّل مسبقاً، احضر في الموعد، واطرح أسئلتك في الوقت الحقيقي.",
    points: ["تسجيل مسبق للجلسات", "تفاعل مباشر مع الخبير", "أسئلة وأجوبة حيّة"],
    cta: { label: "الجلسات القادمة", href: routes.live },
    color: "sky",
    // poster: "مباشر",
  },
  {
    id: "packages",
    label: "الباقات",
    title: "باقات تجمع عدة دورات في مسار واحد",
    body: "اختر باقة مصمّمة حول هدف مهني واضح — التسويق، المالية، المبيعات أو التميز الوظيفي — واحصل على عدد من الدورات معاً.",
    points: ["دورات مختارة حول هدف واحد", "قيمة أعلى من الشراء المنفرد", "مسار تعلّم واضح"],
    cta: { label: "تصفّح الباقات", href: routes.packages },
    color: "green",
    // poster: "باقات",
  },
  {
    id: "consultations",
    label: "الاستشارات",
    title: "جلسات فردية مع خبير في مجالك",
    body: "احجز استشارة واحدة أو برنامج إرشاد من عدة جلسات مع خبراء ماستري، واحصل على إجابات مخصّصة لمشروعك أو مسيرتك.",
    points: ["جلسات فردية عبر اجتماع مرئي", "مواعيد متاحة للحجز", "استشارة أو برنامج إرشاد"],
    cta: { label: "احجز استشارة", href: routes.consultations },
    color: "lilac",
    // poster: "استشر",
  },
  {
    id: "business",
    label: "للشركات",
    title: "تدريب فرق العمل في مجالات متعددة",
    body: "برامج تدريبية للموظفين في التسويق والمبيعات والإدارة والمالية والموارد البشرية وغيرها، مع متابعة وتقارير لمدراء التدريب.",
    points: ["برامج حسب احتياج الفريق", "متابعة تقدّم الموظفين", "تقارير لمدراء التدريب"],
    cta: { label: "اطلب عرضاً لشركتك", href: routes.business },
    color: "teal",
    // poster: "فرق",
  },
];
