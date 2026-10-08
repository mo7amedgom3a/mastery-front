import type { FaqVM } from "@/features/landing/model/types";
import { sharedFaqs } from "@/features/product-detail/content/faqs";

/** Direct, extractable answers (GEO): answer first, then detail. Also emitted as FAQPage JSON-LD. */
export const bundleFaqs: readonly FaqVM[] = [
  {
    question: "ما الفرق بين حزم ماستري والباقات؟",
    answer:
      "الباقة تجمع عدة دورات مسجّلة، أما حزمة ماستري فمسار متكامل قد يجمع دبلومات ودورات واستشارات فردية مع الخبراء في اشتراك واحد.",
  },
  {
    question: "هل أحصل على كل محتوى الحزمة فور الاشتراك؟",
    answer:
      "نعم، تُفتح لك الدبلومات والدورات المدرجة في الحزمة فور إتمام الاشتراك، وتحجز موعد الاستشارات المشمولة في الوقت الذي يناسبك.",
  },
  {
    question: "كم مدة الوصول إلى محتوى الحزمة؟",
    answer: "تشاهد محتوى كل برامج الحزمة مرات غير محدودة طوال مدة الوصول الموضّحة في صفحتها، وهي عام كامل في أغلب الحزم.",
  },
  {
    question: "هل أحصل على شهادة لكل برنامج في الحزمة؟",
    answer:
      "نعم، تحصل على شهادة إتمام مستقلة لكل دورة أو دبلوم تنهيه داخل الحزمة، تحمل رقماً تسلسلياً يمكن التحقق منه عبر المنصة.",
  },
  ...sharedFaqs,
];
