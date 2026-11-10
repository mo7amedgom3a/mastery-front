import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic, Raleway } from "next/font/google";
import type { ReactNode } from "react";

import { SiteJsonLd } from "@/components/seo/site-json-ld";
import { MotionProvider } from "@/components/motion/motion-provider";
import { ReferralTracking } from "@/components/referral/referral-tracking";
import { ShopAuthBridge } from "@/components/shop/shop-auth-bridge";
import { ThemeScript } from "@/components/theme/theme-script";
import { getSiteUrl, isIndexable } from "@/config/env";
import { baseOpenGraph, baseTwitter, siteConfig } from "@/config/site";
import { AdvisorWidget } from "@/features/advisor/components/advisor-widget";
import { getAnnouncements } from "@/features/announcements/api/get-announcements";
import { AnnouncementsProvider } from "@/features/announcements/components/announcements-context";
import { CouponLinkTracking } from "@/features/announcements/components/coupon-link-tracking";
import { dismissScript } from "@/features/announcements/model/bar";
import { getExploreMenu } from "@/features/navigation/api/get-menu-data";
import { ExploreMenuProvider } from "@/features/navigation/components/menu-context";

import "./globals.css";

// Arabic body face. Google's `arabic` subset is ~34 KB per weight (v15) versus ~72 KB for the
// self-hosted files, and only the Arabic range is preloaded: four weights used to cost ~288 KB
// before first paint, which put the hero image behind a font queue on mobile.
const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--nf-plex",
  display: "swap",
  fallback: ["Tahoma", "sans-serif"],
});

// Latin face is only used for numerals and English fragments; don't block first paint on it.
const raleway = Raleway({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--nf-raleway",
  display: "swap",
  preload: false,
  fallback: ["Helvetica Neue", "Arial", "sans-serif"],
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  category: "education",
  authors: [{ name: siteConfig.name, url: getSiteUrl() }],
  creator: siteConfig.name,
  publisher: siteConfig.name,
  alternates: {
    types: {
      "application/rss+xml": "/feed.xml",
      "text/markdown": "/llms.txt",
    },
  },
  // Staging / previews are noindexed (see `isIndexable`); production allows full snippets and previews.
  robots: isIndexable()
    ? {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          "max-image-preview": "large",
          "max-snippet": -1,
          "max-video-preview": -1,
        },
      }
    : { index: false, follow: false },
  // og:url is set per page (a layout value would be inherited by every route). Images come from the
  // app/opengraph-image.jpg and app/twitter-image.jpg file conventions.
  openGraph: {
    ...baseOpenGraph,
    title: `${siteConfig.name} | ${siteConfig.nameEn}`,
    description: siteConfig.shareDescription,
  },
  twitter: {
    ...baseTwitter,
    title: `${siteConfig.name} | ${siteConfig.nameEn}`,
    description: siteConfig.shareDescription,
  },
  // Icons come from app/icon.svg and app/apple-icon.png; the manifest from app/manifest.ts.
};

export const viewport: Viewport = {
  themeColor: "#17161b",
};

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default async function RootLayout({ children }: RootLayoutProps) {
  // One cached read for the whole app: the header's explore menu uses it from a client context so
  // SiteHeader stays importable from client components (admin previews).
  // The announcement bar (above the header) reads its bars the same way.
  const [menu, announcements] = await Promise.all([getExploreMenu(), getAnnouncements()]);
  return (
    // Dark is the default look; ThemeScript swaps in a saved "light" choice before first paint,
    // hence suppressHydrationWarning on this one attribute.
    <html
      lang="ar"
      dir="rtl"
      data-theme="dark"
      suppressHydrationWarning
      className={`${plexArabic.variable} ${raleway.variable}`}
    >
      <head>
        <ThemeScript />
        {/* Hides announcement bars this visitor dismissed before first paint. */}
        <script dangerouslySetInnerHTML={{ __html: dismissScript }} />
      </head>
      <body className="ma-page">
        <a href="#main" className="skip-link">
          تخطَّ إلى المحتوى
        </a>
        <MotionProvider>
          <ExploreMenuProvider menu={menu}>
            <AnnouncementsProvider bars={announcements}>
              <SiteJsonLd />
              {children}
              <ShopAuthBridge />
              <AdvisorWidget />
              <ReferralTracking />
              <CouponLinkTracking />
            </AnnouncementsProvider>
          </ExploreMenuProvider>
        </MotionProvider>
      </body>
    </html>
  );
}
