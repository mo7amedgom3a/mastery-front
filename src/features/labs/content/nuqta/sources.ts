/**
 * Public sources behind the regulatory facts the journey labs simulate, checked on 15 Nov 2026.
 * The labs are training simulations: fees, rates and waves change, and several sources below are
 * law-firm or consultancy summaries rather than official texts. Each lab lists the ones it uses.
 */
import type { JourneySlug } from "../../model/types";

export const SOURCES_CHECKED = "15 نوفمبر 2026";

export type Source = { id: string; title: string; url: string; note: string };

export const sources: Record<string, Source> = {
  crLaw: {
    id: "crLaw",
    title: "نظام السجل التجاري الجديد ولائحته (Clyde & Co، 2025)",
    url: "https://www.clydeco.com/en/insights/2025/09/ksa-commercial-registration-law-and-trade-name-law",
    note: "نافذ منذ 3 أبريل 2025: السجل لا ينتهي، ويُستبدل التجديد بتأكيد سنوي للبيانات، وسجل وطني موحد بدل سجلات المدن والفروع.",
  },
  crConfirm: {
    id: "crConfirm",
    title: "التأكيد السنوي للسجل التجاري (Setup in Saudi)",
    url: "https://www.setupinsaudi.com/en/commercial-registration-cr-annual-confirmation-in-saudi-arabia",
    note: "يُقدَّم عبر المركز السعودي للأعمال؛ عدم التأكيد خلال 90 يومًا يعلّق السجل (المراحل اللاحقة تختلف بين المصادر).",
  },
  misa: {
    id: "misa",
    title: "ترخيص وزارة الاستثمار للشركات ذات الشريك الأجنبي (Healy / Middle East Briefing)",
    url: "https://www.middleeastbriefing.com/news/?p=4059",
    note: "ترخيص الاستثمار يسبق السجل التجاري عند وجود شريك أجنبي؛ الرسوم والمدة ورأس المال تختلف بحسب النشاط، فالأرقام في المختبر تقديرية.",
  },
  companiesLaw: {
    id: "companiesLaw",
    title: "نظام الشركات 2023 (Tamimi / Mondaq)",
    url: "https://www.mondaq.com/saudiarabia/shareholders/1602384/saudi-arabia-issues-new-commercial-companies-law",
    note: "نافذ منذ 19 يناير 2023: الشركة ذات المسؤولية المحدودة يديرها مدير أو أكثر أو مجلس مديرين بحسب عقد التأسيس، ورُفع الحد الأعلى لعدد أعضاء مجلس المساهمة.",
  },
  vat: {
    id: "vat",
    title: "حدود التسجيل في ضريبة القيمة المضافة والإقرارات (Rödl & Partner)",
    url: "https://roedl.com/insights/vat-guidelines/saudi-arabia-rate-registration-declaration-requirements",
    note: "تسجيل إلزامي فوق 375,000 ر.س واختياري فوق 187,500 ر.س؛ إقرار ربعي لمن توريداته 40 مليونًا أو أقل، يُستحق في آخر الشهر التالي للفترة. النسبة 15٪.",
  },
  fatoora: {
    id: "fatoora",
    title: "الفوترة الإلكترونية: المرحلة الثانية والموجة 25 (KPMG، 2026)",
    url: "https://kpmg.com/us/en/taxnewsflash/news/2026/07/saudi-arabia-e-invoicing-mandatory-for-taxpayers-with-revenue-above-sar-187500.html",
    note: "الموجة 25 تخفض حد الربط مع «فاتورة» إلى 187,500 ر.س، والربط من 1 فبراير 2027؛ الهيئة تبلّغ كل موجة قبل ستة أشهر على الأقل.",
  },
  gosi: {
    id: "gosi",
    title: "اشتراكات التأمينات الاجتماعية (Qoyod / PaySpace)",
    url: "https://www.qoyod.com/en/learn/gosi-contribution-rates/",
    note: "النظام القائم: 21.5٪ للسعودي (9.75٪ موظف + 11.75٪ منشأة) و2٪ أخطار مهنية لغير السعودي؛ نسب المشتركين الجدد منذ يوليو 2024 ترتفع تدريجيًا.",
  },
  postSetup: {
    id: "postSetup",
    title: "الالتزامات في أول 90 يومًا بعد التأسيس (Sovereign Group)",
    url: "https://www.sovereigngroup.com/news/saudi-arabia-post-setup-compliance-the-first-90-days-for-foreign-companies/",
    note: "بعد السجل: العنوان الوطني، التسجيل الضريبي، التأمينات وقوى، ثم مقيم والتأشيرات وفتح الحساب البنكي.",
  },
  pdpl: {
    id: "pdpl",
    title: "إشعار تسرب البيانات الشخصية لسدايا (Baker McKenzie)",
    url: "https://insightplus.bakermckenzie.com/bm/data-technology/saudi-arabia-publishes-guidance-on-data-breach-notification",
    note: "إشعار سدايا خلال 72 ساعة من العلم بالحادثة إذا كانت قد تضر بأصحاب البيانات، عبر المنصة الوطنية لحوكمة البيانات؛ والتأخير يحتاج تبريرًا.",
  },
  pdplDraft: {
    id: "pdplDraft",
    title: "مسودة تعديلات اللائحة التنفيذية لنظام حماية البيانات (Akin Gump، أكتوبر 2026)",
    url: "https://www.akingump.com/en/insights/alerts/saudi-data-and-ai-authority-proposes-amendments-to-implementing-regulations-of-the-pdpl-10-key-proposed-changes",
    note: "مسودة للاستشارة تقترح إلغاء شرط «الضرر» لإشعار 72 ساعة؛ لم تُعتمد بعد عند مراجعتنا.",
  },
};

/** Sources each lab cites in its «المراجع» panel. */
export const labSources: Record<JourneySlug, readonly string[]> = {
  "startup-company-registration": ["misa", "crLaw", "crConfirm", "postSetup", "vat", "gosi"],
  "governance-first-board": ["companiesLaw"],
  "cfo-forecast-runway": ["vat", "gosi"],
  "finance-quarter-close": ["vat", "fatoora"],
  "crisis-data-leak": ["pdpl", "pdplDraft"],
  "audit-escape-room": ["companiesLaw", "vat"],
};
