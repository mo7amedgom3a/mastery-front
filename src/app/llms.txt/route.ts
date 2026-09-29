import { getSiteUrl } from "@/config/env";
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
    // Live sessions have no landing section of their own; they point at the offerings tabs.
    ...offerings.map(
      (offering) =>
        `- [${offering.label}](${siteUrl}/#${offering.id === "live" ? "offerings" : offering.id}): ${offering.title}. ${offering.body}`,
    ),
    "",
    "## الأسئلة الشائعة",
    "",
    ...fallbackFaqs.flatMap((faq) => [`### ${faq.question}`, "", faq.answer, ""]),
    "## روابط",
    "",
    `- [الصفحة الرئيسية](${siteUrl}/)`,
    `- [من نحن](${siteUrl}/#about)`,
    `- [الخبراء](${siteUrl}/#experts)`,
    `- [حلول تدريب الشركات](${siteUrl}/#business)`,
    `- [خريطة الموقع](${siteUrl}/sitemap.xml)`,
    "",
  ].join("\n");

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
