import { getSiteUrl } from "@/config/env";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";
import { aboutCopy, heroCopy } from "@/features/landing/content/copy";
import { fallbackFaqs } from "@/features/landing/content/faqs";
import { offerings } from "@/features/landing/content/offerings";

// Built once at build time from the same content the landing page renders.
export const dynamic = "force-static";

/**
 * /llms.txt (llmstxt.org): a plain-Markdown brief for AI assistants and answer engines. Low cost,
 * not a ranking factor. It only restates what is visible on the site.
 */
export function GET() {
  const siteUrl = getSiteUrl();

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
    `- الموقع الرسمي: ${siteUrl}/`,
    "",
    "## ما تقدّمه الأكاديمية",
    "",
    // Live sessions have their own listing page; the rest point at their landing sections.
    ...offerings.map(
      (offering) =>
        `- [${offering.label}](${offering.id === "live" ? `${siteUrl}${routes.live}` : `${siteUrl}/#${offering.id}`}): ${offering.title}. ${offering.body}`,
    ),
    "",
    "## الأسئلة الشائعة",
    "",
    ...fallbackFaqs.flatMap((faq) => [`### ${faq.question}`, "", faq.answer, ""]),
    "## روابط",
    "",
    `- [الصفحة الرئيسية](${siteUrl}/)`,
    `- [كل البرامج (بحث وتصفية)](${siteUrl}${routes.search})`,
    `- [الدورات](${siteUrl}${routes.courses})`,
    `- [الدبلومات](${siteUrl}${routes.diplomas})`,
    `- [الباقات](${siteUrl}${routes.packages})`,
    `- [الاستشارات](${siteUrl}${routes.consultations})`,
    `- [دورات البث المباشر](${siteUrl}${routes.live})`,
    `- [من نحن](${siteUrl}/#about)`,
    `- [الخبراء](${siteUrl}/#experts)`,
    `- [حلول تدريب الشركات](${siteUrl}${routes.business})`,
    `- [انضم كمدرب](${siteUrl}${routes.trainers})`,
    `- [خريطة الموقع](${siteUrl}/sitemap.xml)`,
    "",
  ].join("\n");

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
