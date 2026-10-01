import type { Route } from "next";
import Image from "next/image";
import type { ReactNode } from "react";

import { Logo } from "@/components/brand/logo";
import { SocialIcon, socialLabel, type SocialNetwork } from "@/components/icons/social-icons";
import { AppLink } from "@/components/ui/app-link";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/cn";

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
      { label: "حول ماستري أكاديمي", href: routes.section("about") },
      { label: "الخبراء", href: routes.section("experts") },
      { label: "انضم لنا كمدرب", href: routes.trainers },
      { label: "للشركات", href: routes.business },
    ],
  },
  {
    title: "روابط مهمة",
    links: [
      { label: "سلة المشتريات", href: routes.cart },
      { label: "الأسئلة الشائعة", href: routes.section("faq") },
      { label: "سياسة الخصوصية", href: routes.privacy },
      { label: "الشروط والأحكام", href: routes.terms },
    ],
  },
];

// Same order as `siteConfig.social`.
const NETWORKS: readonly SocialNetwork[] = ["instagram", "facebook", "x", "linkedin", "youtube"];

const apps = [
  { href: siteConfig.apps.appStore, icon: "/icons/apple-store.svg", store: "App Store" },
  { href: siteConfig.apps.googlePlay, icon: "/icons/google-play-store.svg", store: "Google Play" },
];

// Mada, Tamara and Visa are drawn in a band across a square canvas: `cover` crops the empty top and
// bottom so the mark fills the chip. Mastercard's artwork is already tight.
const payments: { src: string; name: string; fit: "object-cover" | "object-contain" }[] = [
  { src: "/icons/visa.svg", name: "Visa", fit: "object-cover" },
  { src: "/icons/mastercard.svg", name: "Mastercard", fit: "object-contain" },
  { src: "/icons/Mada-01.svg", name: "مدى", fit: "object-cover" },
  { src: "/icons/Tamara-02.svg", name: "تمارا", fit: "object-cover" },
];

/** External link in the footer: new tab, and announced as such. */
function ExternalLink({ href, label, className, children }: { href: string; label: string; className?: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" aria-label={`${label} (يفتح في نافذة جديدة)`} className={className}>
      {children}
    </a>
  );
}

/** Kit `.ma-footer`: always ink. Brand and links, then accreditation and the app, then payments. */
export function SiteFooter() {
  return (
    <footer className="ma-footer">
      <div className="ma-container grid gap-12 md:grid-cols-[minmax(0,1.3fr)_repeat(3,minmax(0,1fr))]">
        <div className="flex flex-col gap-6">
          <Logo tone="on-dark" className="w-48" />
          <p className="ma-footer__small m-0 max-w-xs">
            منصة عربية للتعلّم عن بُعد في التسويق والإدارة والقيادة وريادة الأعمال، منذ {siteConfig.foundingYear}.
          </p>
          <div>
            <h2 className="m-0 mb-3 text-sm font-bold text-white">تابعنا على</h2>
            <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
              {NETWORKS.map((network, index) => (
                <li key={network}>
                  <ExternalLink
                    href={siteConfig.social[index]}
                    label={`${siteConfig.name} على ${socialLabel[network]}`}
                    className="grid size-11 place-items-center border border-white/25 transition-colors hover:border-white"
                  >
                    <SocialIcon network={network} className="size-5" />
                  </ExternalLink>
                </li>
              ))}
            </ul>
          </div>
        </div>
        {columns.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <h2 className="m-0 mb-4 text-sm font-bold text-white">{column.title}</h2>
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

      <div className="ma-container mt-12 flex flex-col gap-8 border-t border-white/15 pt-8 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-4">
          <Image src="/icons/cpd.svg" alt="The CPD Certification Service" width={180} height={51} unoptimized className="h-auto w-[180px]" />
          <p className="ma-footer__small m-0 max-w-[16rem]">برامج ودورات معتمدة ضمن إطار التطوير المهني المستمر</p>
        </div>
        <div>
          <h2 className="m-0 mb-3 text-sm font-bold text-white">حمّل التطبيق</h2>
          <ul className="m-0 flex list-none flex-wrap gap-3 p-0">
            {apps.map((app) => (
              <li key={app.store}>
                <ExternalLink
                  href={app.href}
                  label={`تطبيق ${siteConfig.name} على ${app.store}`}
                  className="flex min-h-12 items-center gap-3 border border-white/25 px-4 py-2 transition-colors hover:border-white"
                >
                  <Image src={app.icon} alt="" width={24} height={24} unoptimized className="size-6" />
                  <span className="flex flex-col text-start leading-tight">
                    <span className="text-[11px]">حمّله من</span>
                    <span dir="ltr" className="text-sm font-bold text-white">
                      {app.store}
                    </span>
                  </span>
                </ExternalLink>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="ma-container mt-8 flex flex-col-reverse gap-4 border-t border-white/15 pt-6 md:flex-row md:items-center md:justify-between">
        <p className="ma-footer__small m-0">
          © {new Date().getFullYear()} {siteConfig.name}. جميع الحقوق محفوظة.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <span className="ma-footer__small">بوابات دفع آمنة</span>
          <ul aria-label="وسائل الدفع" className="m-0 flex list-none flex-wrap gap-2 p-0">
            {payments.map((payment) => (
              <li key={payment.name} className="relative h-9 w-16 overflow-hidden bg-white">
                <Image src={payment.src} alt={payment.name} fill sizes="64px" unoptimized className={cn("p-1", payment.fit)} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
