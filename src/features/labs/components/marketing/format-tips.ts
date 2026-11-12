import type { Platform, Visual } from "../../model/ad-market";

/** Platform-native format advice (not the hidden score): what this placement rewards. */
export function formatTip(platform: Platform, visual: Visual): { tone: "good" | "warn"; text: string } {
  const video = visual === "v-reel";
  switch (platform) {
    case "tiktok":
      return video
        ? { tone: "good", text: "تيك توك منصة فيديو عمودي: المقطع القصير هو الشكل الأصلي هنا." }
        : { tone: "warn", text: "تيك توك منصة فيديو: الصور الثابتة تظهر كعرض شرائح وتتفاعل أقل." };
    case "instagram":
      return video
        ? { tone: "good", text: "الفيديو يظهر كريلز بملء الشاشة، وهو أكثر صيغ إنستغرام وصولًا." }
        : { tone: "good", text: "الصورة تظهر كمنشور مربع في الخلاصة؛ اجعل المنتج واضحًا من أول نظرة." };
    case "facebook":
      return { tone: "good", text: "فيسبوك يعرض النص فوق الصورة وبطاقة رابط تحتها: الجملة الأولى هي ما يُقرأ." };
    case "x":
      return video
        ? { tone: "warn", text: "على إكس النص هو البطل والفيديو يظهر صغيرًا داخل التغريدة." }
        : { tone: "good", text: "على إكس النص هو البطل: عنوان قصير وجذاب يصنع الفرق." };
    case "snapchat":
      return video
        ? { tone: "good", text: "سناب يعرض الإعلان بملء الشاشة بين القصص: الفيديو يشد الانتباه سريعًا." }
        : { tone: "warn", text: "سناب يعرض بملء الشاشة لثوانٍ: الصورة الثابتة تُتجاوز بسرعة." };
  }
}
