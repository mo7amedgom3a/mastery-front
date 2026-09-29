import { BadgeCheck, Infinity as InfinityIcon, MessagesSquare, MonitorSmartphone, Radio, Headset } from "lucide-react";

import type { ProductKind } from "../model/types";

export const kindLabel: Record<ProductKind, string> = { course: "دورة", diploma: "دبلوم" };
export const kindListLabel: Record<ProductKind, string> = { course: "الدورات", diploma: "الدبلومات" };

export const benefits = [
  { icon: MonitorSmartphone, text: "تابع المحتوى من أي جهاز، أينما كنت ووقتما تريد" },
  { icon: BadgeCheck, text: "احصل على شهادة معتمدة من ماستري بعد الإتمام" },
  { icon: InfinityIcon, text: "شاهد المحتوى مرات غير محدودة لمدة عام كامل" },
  { icon: Radio, text: "تعلّم مع دبلومات بث مباشر تفاعلية" },
  { icon: MessagesSquare, text: "اطرح أسئلتك واستفد من خبرة المدربين" },
  { icon: Headset, text: "خدمة عملاء تتابع معك حتى تبدأ" },
] as const;

export const certificateCopy = {
  title: "شهادات معتمدة يمكن التحقق منها",
  lead: "جميع برامجنا معتمدة من ماستري أكاديمي – ماليزيا ومعهد CPD للتطوير المهني المستمر – المملكة المتحدة.",
  points: [
    "شهادة إتمام صادرة من ماستري أكاديمي للتدريب – ماليزيا لكل برنامج على المنصة.",
    "ساعات تدريب معتمدة دولياً (Accredited Training Hours) من CPD – المملكة المتحدة مقابل رسوم إضافية.",
    "لكل شهادة رقم تسلسلي خاص يمكن التحقق منه عبر المنصة.",
  ],
} as const;
