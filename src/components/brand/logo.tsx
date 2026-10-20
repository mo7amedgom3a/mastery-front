import Image from "next/image";
import type { CSSProperties } from "react";

import { cn } from "@/lib/cn";

type LogoProps = {
  className?: string;
  /** Height in px; width follows the logo's aspect ratio (300.4 × 34.1). */
  height?: number;
  priority?: boolean;
  /**
   * `theme` follows the active theme (white word on dark, ink word on light).
   * `on-dark` is for surfaces that stay ink in every theme (footer).
   */
  tone?: "theme" | "on-dark";
  /** `business`: the eMastery Business lockup (the logo plus a "Business" word) for company pages. */
  variant?: "default" | "business";
};

const LOGO_RATIO = 300.4 / 34.1;

/** Kit logo files (coral mark + white or ink word) — never retype or recolour them. */
export function Logo({ className, height = 24, priority, tone = "theme", variant = "default" }: LogoProps) {
  if (variant === "business") {
    // The kit files stay untouched; "Business" sits beside them, sized to the word mark.
    return (
      <span role="img" aria-label="eMastery Business" className="ma-logo-business" style={{ "--logo-h": `${height}px` } as CSSProperties}>
        <span aria-hidden="true" className="contents">
          <Logo className={className} height={height} priority={priority} tone={tone} />
        </span>
        <span aria-hidden="true" className={cn("ma-logo-business__word", tone === "on-dark" && "is-on-dark")}>
          Business
        </span>
      </span>
    );
  }
  const size = { width: Math.round(height * LOGO_RATIO), height };
  const imageClass = cn("ma-logo h-auto max-w-full", className);

  if (tone === "on-dark") {
    return <Image src="/brand/ma-logo-coral-white.svg" alt="ماستري أكاديمي" {...size} priority={priority} unoptimized className={imageClass} />;
  }

  // Both files are ~4 KB SVGs; CSS shows the one matching the theme, so there's no flash or hydration mismatch.
  return (
    <>
      <Image
        src="/brand/ma-logo-coral-white.svg"
        alt="ماستري أكاديمي"
        {...size}
        priority={priority}
        unoptimized
        className={cn(imageClass, "theme-dark-only")}
      />
      <Image
        src="/brand/ma-logo-coral-ink.svg"
        alt="ماستري أكاديمي"
        {...size}
        priority={priority}
        unoptimized
        className={cn(imageClass, "theme-light-only")}
      />
    </>
  );
}
