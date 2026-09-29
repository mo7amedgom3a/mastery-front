import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import type { ReactNode } from "react";

import { MotionProvider } from "@/components/motion/motion-provider";
import { ShopAuthBridge } from "@/components/shop/shop-auth-bridge";
import { ThemeScript } from "@/components/theme/theme-script";
import { getSiteUrl, isIndexable } from "@/config/env";
import { baseOpenGraph, siteConfig } from "@/config/site";

import "./globals.css";

const plexArabic = localFont({
  src: [
    { path: "./fonts/IBMPlexSansArabic-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/IBMPlexSansArabic-Medium.woff2", weight: "500", style: "normal" },
    { path: "./fonts/IBMPlexSansArabic-SemiBold.woff2", weight: "600", style: "normal" },
    { path: "./fonts/IBMPlexSansArabic-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--nf-plex",
  display: "swap",
  fallback: ["Tahoma", "sans-serif"],
});

// Latin face is only used for numerals and English fragments; don't block first paint on it.
const raleway = localFont({
  src: [
    { path: "./fonts/Raleway-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/Raleway-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/Raleway-700.woff2", weight: "700", style: "normal" },
  ],
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
    card: "summary_large_image",
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

export default function RootLayout({ children }: RootLayoutProps) {
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
      </head>
      <body className="ma-page">
        <a href="#main" className="skip-link">
          تخطَّ إلى المحتوى
        </a>
        <MotionProvider>
          {children}
          <ShopAuthBridge />
        </MotionProvider>
      </body>
    </html>
  );
}
