import type { Metadata } from "next";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { AppLink } from "@/components/ui/app-link";
import { ButtonLink } from "@/components/ui/button";
import type { Route } from "next";

import { routes } from "@/config/routes";

export const metadata: Metadata = {
  title: "الصفحة غير موجودة",
  robots: { index: false, follow: true },
};

const shortcuts: { href: Route; label: string }[] = [
  { href: routes.courses, label: "الدورات" },
  { href: routes.diplomas, label: "الدبلومات" },
  { href: routes.packages, label: "الباقات" },
  { href: routes.consultations, label: "الاستشارات" },
  { href: routes.section("faq"), label: "الأسئلة الشائعة" },
];

/** Real 404 (status and noindex) that still gives crawlers and people a way back into the site. */
export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="outline-none">
        <section aria-labelledby="not-found-title" className="ma-section">
          <div className="ma-container flex max-w-[40rem] flex-col items-start gap-6">
            <span className="ma-tag ma-tag--outline">خطأ 404</span>
            <h1 id="not-found-title" className="t-section m-0">
              لم نجد هذه الصفحة
            </h1>
            <p className="t-lead m-0">
              ربما نُقلت الصفحة أو لم تعد متاحة. ابدأ من الصفحة الرئيسية أو انتقل مباشرة إلى ما تبحث عنه.
            </p>
            <ButtonLink href={routes.home} variant="primary" size="lg">
              العودة إلى الصفحة الرئيسية
            </ButtonLink>
            <nav aria-label="روابط سريعة">
              <ul className="ma-cluster m-0 list-none p-0">
                {shortcuts.map((shortcut) => (
                  <li key={shortcut.href}>
                    <AppLink href={shortcut.href}>{shortcut.label}</AppLink>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
