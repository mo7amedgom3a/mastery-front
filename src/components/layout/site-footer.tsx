import type { Route } from "next";

import { Logo } from "@/components/brand/logo";
import { AppLink } from "@/components/ui/app-link";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";

const columns: { title: string; links: { label: string; href: Route }[] }[] = [
  {
    title: "تعلّم",
    links: [
      { label: "الدورات", href: routes.courses },
      { label: "الدبلومات", href: routes.diplomas },
      { label: "البث المباشر", href: routes.live },
      { label: "الباقات", href: routes.packages },
      { label: "الاستشارات", href: routes.consultations },
    ],
  },
  {
    title: "الأكاديمية",
    links: [
      { label: "من نحن", href: routes.section("about") },
      { label: "الخبراء", href: routes.section("experts") },
      { label: "للشركات", href: routes.business },
      { label: "للمدربين", href: routes.trainers },
      { label: "الأسئلة الشائعة", href: routes.section("faq") },
    ],
  },
  {
    title: "الحساب",
    links: [
      { label: "تسجيل الدخول", href: routes.login },
      { label: "إنشاء حساب", href: routes.register },
      { label: "سياسة الخصوصية", href: routes.privacy },
      { label: "الشروط والأحكام", href: routes.terms },
    ],
  },
];

/** Kit `.ma-footer`: always ink. */
export function SiteFooter() {
  return (
    <footer className="ma-footer">
      <div className="ma-container grid gap-12 md:grid-cols-[minmax(0,1.3fr)_repeat(3,minmax(0,1fr))]">
        <div className="flex flex-col gap-4">
          <Logo tone="on-dark" className="w-48" />
          <p className="ma-footer__small max-w-xs">
            منصة عربية للتعلّم عن بُعد في التسويق والإدارة والقيادة وريادة الأعمال، منذ {siteConfig.foundingYear}.
          </p>
        </div>
        {columns.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <h2 className="mb-4 text-sm font-bold text-white">{column.title}</h2>
            <ul className="m-0 flex list-none flex-col gap-3 p-0">
              {column.links.map((link) => (
                <li key={link.label}>
                  <AppLink href={link.href}>{link.label}</AppLink>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="ma-container mt-12">
        <p className="ma-footer__small border-t border-white/15 pt-6">
          © {new Date().getFullYear()} {siteConfig.name}. جميع الحقوق محفوظة.
        </p>
      </div>
    </footer>
  );
}
