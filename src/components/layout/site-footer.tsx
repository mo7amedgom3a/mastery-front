import Image from "next/image";
import type { ReactNode } from "react";

import { Logo } from "@/components/brand/logo";
import { SocialIcon, socialLabel, type SocialNetwork } from "@/components/icons/social-icons";
import { AppLink } from "@/components/ui/app-link";
import { ButtonLink } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/cn";

import {
  enterpriseBannerData,
  navigationColumns,
  skillDirectoryColumns,
} from "./footer-data";

// Same order as `siteConfig.social`.
const NETWORKS: readonly SocialNetwork[] = ["instagram", "facebook", "x", "linkedin", "youtube"];

const apps = [
  { href: siteConfig.apps.appStore, icon: "/icons/apple-store.svg", store: "App Store" },
  { href: siteConfig.apps.googlePlay, icon: "/icons/google-play-store.svg", store: "Google Play" },
];

// Mada and Visa are drawn in a band across a square canvas: `cover` crops the empty top and bottom so
// the mark fills the chip. Mastercard's artwork is already tight, and Tamara's official gradient
// wordmark must not be cropped or altered.
const payments: { src: string; name: string; fit: "object-cover" | "object-contain" }[] = [
  { src: "/icons/visa.svg", name: "Visa", fit: "object-cover" },
  { src: "/icons/mastercard.svg", name: "Mastercard", fit: "object-contain" },
  { src: "/icons/Mada-01.svg", name: "مدى", fit: "object-cover" },
  { src: "/icons/tamara-logo-ar.png", name: "تمارا", fit: "object-contain" },
];

/** External link in the footer: new tab, and announced as such. */
function ExternalLink({
  href,
  label,
  className,
  children,
}: {
  href: string;
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${label} (يفتح في نافذة جديدة)`}
      className={className}
    >
      {children}
    </a>
  );
}

/**
 * Enhanced site footer:
 * 1. Enterprise Trust Banner (coral band with on-color CTAs matching cta-band pattern)
 * 2. Explore Top Skills, Categories, Tags & Common Searches (4-column directory)
 * 3. Platform & Corporate Navigation (Enterprise, Pricing, Learn, Academy, Legal)
 * 4. Accreditation & Mobile Apps
 * 5. Bottom Utility Bar & Safe Payment Providers
 */
export function SiteFooter() {
  return (
    <footer className="ma-footer" data-theme="dark">
      {/* 1. Enterprise Trust Banner */}
      <div className="ma-container mb-12">
        <div className="flex flex-col gap-8 rounded-panel bg-coral p-6 text-ink md:p-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex max-w-2xl flex-col gap-3">
            <div>
              <span className="ma-tag ma-tag--ink">
                {enterpriseBannerData.tag}
              </span>
            </div>
            <h2 className="m-0 text-lg font-bold text-ink md:text-xl">
              {enterpriseBannerData.title}
            </h2>
            <p className="m-0 text-sm leading-relaxed text-ink/85">
              {enterpriseBannerData.description}
            </p>
            <ul className="m-0 mt-1 flex list-none flex-wrap gap-x-6 gap-y-2 p-0 text-xs text-ink/80">
              {enterpriseBannerData.highlights.map((item) => (
                <li key={item.label} className="flex items-center gap-1.5">
                  <span className="inline-block size-1.5 rounded-full bg-ink" aria-hidden="true" />
                  <span>{item.label}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <ButtonLink
              href={enterpriseBannerData.primaryAction.href}
              variant="on-color"
              size="lg"
              className="hover:!text-ink"
            >
              {enterpriseBannerData.primaryAction.label}
            </ButtonLink>
            <ButtonLink
              href={enterpriseBannerData.secondaryAction.href}
              variant="on-color"
              size="lg"
              className="hover:!text-ink"
            >
              {enterpriseBannerData.secondaryAction.label}
            </ButtonLink>
          </div>
        </div>
      </div>

      {/* 2. Top Skills & Directory Grid (Udemy-style 4-column directory) */}
      <div className="ma-container border-b border-line pb-12">
        <div className="mb-6 flex flex-col gap-1">
          <h2 className="m-0 text-base font-bold text-fg">استكشف المهارات والمجالات الأكثر طلباً</h2>
          <p className="ma-footer__small m-0 text-xs text-fg-muted">
            تصفح برامج ماستري عبر المهارات التخصصية، الوسوم الشائعة، وعمليات البحث الأكثر صلة.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {skillDirectoryColumns.map((col) => (
            <div key={col.title} className="flex flex-col gap-3">
              <h3 className="m-0 text-sm font-bold text-fg">{col.title}</h3>
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <AppLink
                      href={link.href}
                      className="text-xs text-fg-muted transition-colors hover:text-fg"
                    >
                      {link.label}
                    </AppLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Main Navigation & Brand Overview */}
      <div className="ma-container mt-12 grid gap-12 lg:grid-cols-[minmax(0,1.2fr)_repeat(4,minmax(0,1fr))]">
        <div className="flex flex-col gap-6">
          <Logo tone="on-dark" className="w-48" />
          <p className="ma-footer__small m-0 max-w-xs">
            منصة عربية للتعلّم عن بُعد في التسويق والإدارة والقيادة وريادة الأعمال، منذ {siteConfig.foundingYear}.
          </p>
          <div>
            <h3 className="m-0 mb-3 text-sm font-bold text-fg">تابعنا على</h3>
            <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
              {NETWORKS.map((network, index) => (
                <li key={network}>
                  <ExternalLink
                    href={siteConfig.social[index]}
                    label={`${siteConfig.name} على ${socialLabel[network]}`}
                    className="grid size-11 place-items-center rounded-ctl border border-line transition-colors hover:border-line-strong"
                  >
                    <SocialIcon network={network} className="size-5" />
                  </ExternalLink>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {navigationColumns.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <h3 className="m-0 mb-4 text-sm font-bold text-fg">{column.title}</h3>
            <ul className="m-0 flex list-none flex-col gap-3 p-0">
              {column.links.map((link) => (
                <li key={link.label}>
                  <AppLink href={link.href} className="text-sm">
                    {link.label}
                  </AppLink>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      {/* 4. Accreditation & Mobile App Download */}
      <div className="ma-container mt-12 flex flex-col gap-8 border-t border-line pt-8 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-4">
          <Image
            src="/icons/cpd.svg"
            alt="The CPD Certification Service"
            width={180}
            height={51}
            unoptimized
            className="h-auto w-[180px]"
          />
          <p className="ma-footer__small m-0 max-w-[16rem]">برامج ودورات معتمدة ضمن إطار التطوير المهني المستمر</p>
        </div>
        <div>
          <h3 className="m-0 mb-3 text-sm font-bold text-fg">حمّل التطبيق</h3>
          <ul className="m-0 flex list-none flex-wrap gap-3 p-0">
            {apps.map((app) => (
              <li key={app.store}>
                <ExternalLink
                  href={app.href}
                  label={`تطبيق ${siteConfig.name} على ${app.store}`}
                  className="flex min-h-12 items-center gap-3 rounded-ctl border border-line px-4 py-2 transition-colors hover:border-line-strong"
                >
                  <Image src={app.icon} alt="" width={24} height={24} unoptimized className="size-6" />
                  <span className="flex flex-col text-start leading-tight">
                    <span className="text-[11px]">حمّله من</span>
                    <span dir="ltr" className="text-sm font-bold text-fg">
                      {app.store}
                    </span>
                  </span>
                </ExternalLink>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 5. Copyright & Safe Payments Bar */}
      <div className="ma-container mt-8 flex flex-col-reverse gap-4 border-t border-line pt-6 md:flex-row md:items-center md:justify-between">
        <p className="ma-footer__small m-0">
          © {new Date().getFullYear()} {siteConfig.name}. جميع الحقوق محفوظة.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <span className="ma-footer__small">بوابات دفع آمنة</span>
          <ul aria-label="وسائل الدفع" className="m-0 flex list-none flex-wrap gap-2 p-0">
            {payments.map((payment) => (
              <li key={payment.name} className="relative h-9 w-16 overflow-hidden rounded-ctl bg-white">
                <Image src={payment.src} alt={payment.name} fill sizes="64px" unoptimized className={cn("p-1", payment.fit)} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
