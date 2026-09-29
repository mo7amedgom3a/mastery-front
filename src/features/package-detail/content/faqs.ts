import type { FaqVM } from "@/features/landing/model/types";
import { sharedFaqs } from "@/features/product-detail/content/faqs";

/** Direct, extractable answers (GEO): answer first, then detail. Also emitted as FAQPage JSON-LD. */
export const packageFaqs: readonly FaqVM[] = [
  {
    question: "هل أحصل على كل محتوى الباقة فور الاشتراك؟",
    answer:
      "نعم، تُفتح لك جميع الدورات والدبلومات المدرجة في الباقة فور إتمام الاشتراك، وتتنقّل بينها بالترتيب الذي يناسبك.",
  },
  {
    question: "كم مدة الوصول إلى محتوى الباقة؟",
    answer: "تشاهد محتوى كل برامج الباقة مرات غير محدودة لمدة عام كامل من تاريخ الاشتراك.",
  },
  {
    question: "هل أحصل على شهادة لكل دورة في الباقة؟",
    answer:
      "نعم، تحصل على شهادة إتمام مستقلة لكل دورة أو دبلوم تنهيه داخل الباقة، تحمل رقماً تسلسلياً يمكن التحقق منه عبر المنصة.",
  },
  {
    question: "لماذا أشترك في الباقة بدلاً من شراء الدورات منفصلة؟",
    answer:
      "الباقة تجمع دورات مترابطة في مسار واحد بسعر أقل من مجموع أسعارها منفصلة، فتبني المهارة كاملة من الأساسيات إلى التطبيق.",
  },
  ...sharedFaqs,
];
