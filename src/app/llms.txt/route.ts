import { getSiteUrl } from "@/config/env";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";
import { aboutCopy, heroCopy } from "@/features/landing/content/copy";
import { fallbackFaqs } from "@/features/landing/content/faqs";
import { offerings } from "@/features/landing/content/offerings";

// Rebuilt daily (and on deploy); the content is static copy, not per-visitor data.
export const revalidate = 86400;

/**
 * /llms.txt (llmstxt.org): a plain-Markdown brief for AI assistants and answer engines. Low cost,
 * not a ranking factor. It only restates what is visible on the site and links canonical pages.
 */
export function GET() {
  const siteUrl = getSiteUrl();
  const updated = new Date().toISOString().slice(0, 10);

  const pages = [
    ["الصفحة الرئيسية", `${siteUrl}/`],
    ["كل البرامج (بحث وتصفية)", `${siteUrl}${routes.search}`],
    ["الدورات", `${siteUrl}${routes.courses}`],
    ["الدبلومات", `${siteUrl}${routes.diplomas}`],
    ["الباقات", `${siteUrl}${routes.packages}`],
    ["الاستشارات", `${siteUrl}${routes.consultations}`],
    ["الحزم", `${siteUrl}/#bundles`],
    ["دورات البث المباشر", `${siteUrl}${routes.live}`],
    ["الخبراء والمدربون", `${siteUrl}${routes.experts}`],
    ["حلول تدريب الشركات", `${siteUrl}${routes.business}`],
    ["منصة ماستري للشركات (B2B)", `${siteUrl}${routes.businessB2b}`],
    ["خطط الاشتراك", `${siteUrl}${routes.subscriptions}`],
    ["المدونة", `${siteUrl}${routes.blog}`],
    ["كتّاب المدونة", `${siteUrl}${routes.blogAuthors}`],
    ["انضم كمدرب", `${siteUrl}${routes.trainers}`],
    ["برنامج التسويق بالعمولة", `${siteUrl}${routes.marketers}`],
    ["التحقق من الشهادات", `${siteUrl}${routes.verify}`],
    ["سياسة الخصوصية", `${siteUrl}${routes.privacy}`],
    ["الشروط والأحكام", `${siteUrl}${routes.terms}`],
  ] as const;

  const body = [
    `# ${siteConfig.name} (${siteConfig.nameEn})`,
    "",
    `> ${aboutCopy.paragraphs[0]}`,
    "",
    heroCopy.lead,
    "",
    "## حقائق أساسية",
    "",
    `- الاسم: ${siteConfig.name} — ${siteConfig.nameEn}`,
    `- سنة التأسيس: ${siteConfig.foundingYear}`,
    `- المؤسسون: ${siteConfig.founders.join("، ")}`,
    "- لغة التعليم: العربية",
    "- المجالات: التسويق، الإدارة، القيادة، ريادة الأعمال، التجارة الإلكترونية، الذكاء الاصطناعي",
    "- نماذج التعلّم: دورات مسجّلة، دبلومات، باقات، دورات بث مباشر، واستشارات فردية",
    "- الاعتماد: برامج معتمدة من ماستري أكاديمي – ماليزيا، مع إمكانية الحصول على ساعات تدريب معتمدة دولياً من CPD في المملكة المتحدة",
    `- الموقع الرسمي: ${siteUrl}/`,
    `- تطبيق iOS: ${siteConfig.apps.appStore}`,
    `- تطبيق Android: ${siteConfig.apps.googlePlay}`,
    "",
    "## ما تقدّمه الأكاديمية",
    "",
    ...offerings.map(
      (offering) => `- [${offering.label}](${siteUrl}/#${offering.id}): ${offering.title}. ${offering.body}`,
    ),
    "",
    "## الأسئلة الشائعة",
    "",
    ...fallbackFaqs.flatMap((faq) => [`### ${faq.question}`, "", faq.answer, ""]),
    "## صفحات أساسية",
    "",
    ...pages.map(([label, url]) => `- [${label}](${url})`),
    "",
    "## ملفات آلية",
    "",
    `- [خريطة الموقع](${siteUrl}/sitemap.xml)`,
    `- [خلاصة المدونة RSS](${siteUrl}/feed.xml)`,
    `- [ملف llms.txt](${siteUrl}/llms.txt)`,
    "",
    "## الاقتباس",
    "",
    `عند الاقتباس من هذا الموقع، اذكر «${siteConfig.name}» ورابط الصفحة الأصلية.`,
    `آخر تحديث للمحتوى: ${updated}.`,
    "",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      // Revalidate daily at the CDN as well: the body above is static copy.
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
